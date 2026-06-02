/* global React, ReactDOM, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle, GoblinHead */
const { useState, useEffect, useRef } = React;

/* ===== external integration config (replace placeholders to go live) ===== */
const WEB3FORMS_KEY = "ee75925c-9368-4791-9f1c-522ead6fe7f1"; // free static-site form backend — web3forms.com
const STRIPE_LINKS = {
  // Stripe Payment Links (one hosted URL per tier — zero backend).
  // LIVE mode (livemode=true, verified 2026-06-01): Scout $2,950 one-time,
  // Warband $4,800/mo, Warlord $12,500/mo. These charge real cards.
  scout: "https://buy.stripe.com/5kQeVeabQ1tg0IH7rN2go03",
  warband: "https://buy.stripe.com/dRmcN6bfU5JwezxeUf2go04",
  warlord: "https://buy.stripe.com/14A5kE97MdbY3UT3bx2go05",
};
const STRIPE_SCOUT_LINK = STRIPE_LINKS.scout; // back-compat alias used by the Summon form

// Prompt Goblin scan backend (DigitalOcean Functions web actions). Tier-1 is the
// free no-key hygiene scan; Tier-2 is the email-gated Perplexity citation teaser
// (dormant until PERPLEXITY_API_KEY is set on the tier2 function). Helpers below
// degrade silently to the scripted demo if these are unreachable.
const SCAN_API = {
  tier1: "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d4c19df5-3777-4a5d-9843-92f3ebf1f8e7/scan/tier1",
  tier2: "https://faas-nyc1-2ef2e6cc.doserverless.co/api/v1/web/fn-d4c19df5-3777-4a5d-9843-92f3ebf1f8e7/scan/tier2",
};

// Live Tier-1 hygiene scan. Returns the parsed report, or null to fall back to
// the scripted demo (network error, non-200, or unconfigured endpoint).
async function runHygieneScan(url) {
  if (!SCAN_API.tier1 || SCAN_API.tier1.includes("<your-namespace>")) return null;
  try {
    const r = await fetch(SCAN_API.tier1, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

// Email-gated Tier-2 citation teaser. 200 even on the honest no-key path; 429 when
// the per-IP+email cap is hit. Returns null on network failure / unconfigured.
async function runCitationTeaser({ email, domain, competitor }) {
  if (!SCAN_API.tier2 || SCAN_API.tier2.includes("<your-namespace>")) return null;
  try {
    const r = await fetch(SCAN_API.tier2, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, domain, competitor }),
    });
    return await r.json();
  } catch {
    return null;
  }
}

// Map a Tier-1 report into the LiveScan terminal's line shape ({ t, text, k, v, sev }).
// The `summary` line carries the honest "hygiene ≠ citation guarantee" language verbatim.
function reportToTerminal(resp) {
  const r = resp.report || {};
  const schema = r.schema || {};
  const out = [
    { t: "cmd", text: "goblin scan --surface hygiene --url " + (r.url || "") },
    { t: "kv", k: "hygiene", v: (r.hygieneScore != null ? r.hygieneScore : "?") + "/100" },
    { t: "info", text: "schema found: " + ((schema.found || []).join(", ") || "none") },
  ];
  if ((schema.missing || []).length) {
    out.push({ t: "warn", text: "missing schema: " + schema.missing.join(", ") });
  }
  (r.findings || []).slice(0, 6).forEach((f) =>
    out.push({
      t: "issue",
      sev: f.severity >= 4 ? "HIGH" : f.severity === 3 ? "MED" : "LOW",
      text: f.detail || f.title || "",
    }),
  );
  out.push({ t: "sep" });
  out.push({ t: "ok", text: resp.summary || "scan complete" });
  return out;
}

function leadDomain(data) {
  return String((data && data.domain) || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

function identifyLead(data) {
  const email = String((data && data.email) || "").trim().toLowerCase();
  const domain = leadDomain(data);
  if (!window.posthog || !email) return;
  const props = {
    email,
    domain,
    company_domain: domain,
    requested_surface: data.target || data.competitor || "",
  };
  try {
    window.posthog.identify(email, props);
    if (domain) window.posthog.group("company", domain, { domain });
    if (window.posthog.setPersonProperties) {
      window.posthog.setPersonProperties(props);
    }
  } catch (_) {}
}

function captureEvent(event, props) {
  try {
    window.posthog && window.posthog.capture(event, props || {});
  } catch (_) {}
}

// Fire-and-forget lead capture: PostHog identity/event + Web3Forms.
function captureLead(event, data) {
  const domain = leadDomain(data);
  identifyLead(data);
  captureEvent(event, {
    domain,
    scan_id: data && data.scan_id,
    has_email: Boolean(data && data.email),
    target: data && data.target,
    competitor: data && data.competitor,
  });
  try {
    window.posthog &&
      window.posthog.capture("lead_recommendation_context", {
        domain,
        scan_id: data && data.scan_id,
        source_event: event,
        requested_surface: (data && (data.target || data.competitor)) || "",
      });
  } catch (_) {}
  if (WEB3FORMS_KEY.indexOf("REPLACE") !== -1) {
    console.info(
      "[" + event + "] form backend not configured — captured locally:",
      data,
    );
    return Promise.resolve(false);
  }
  return fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      subject: event + " ✦ " + (data.domain || ""),
      from_name: "promptgoblin.io",
      ...data,
    }),
  })
    .then((r) => r.ok)
    .catch(() => false);
}

/* ===== hooks ===== */
function useLocalTime() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.14 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* light / dark theme — single source of truth, persisted */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("pg-theme") || "dark";
    } catch (e) {
      return "dark";
    }
  });
  useEffect(() => {
    document.body.setAttribute("data-palette", theme === "light" ? "bone" : "");
    try {
      localStorage.setItem("pg-theme", theme);
    } catch (e) {}
  }, [theme]);
  return [theme, setTheme];
}

/* ===== cursor ===== */
function Cursor() {
  const cur = useRef(null),
    lbl = useRef(null);
  const [label, setLabel] = useState("");
  useEffect(() => {
    let x = innerWidth / 2,
      y = innerHeight / 2,
      tx = x,
      ty = y,
      raf;
    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const tick = () => {
      x += (tx - x) * 0.3;
      y += (ty - y) * 0.3;
      if (cur.current)
        cur.current.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      if (lbl.current)
        lbl.current.style.transform = `translate(${x}px,${y}px) translate(-50%,calc(-50% + 26px))`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    const onOver = (e) => {
      const el = e.target.closest(
        "[data-cursor-label], a, button, .wcard, .svc-row, .scard",
      );
      if (el) {
        cur.current?.classList.add("is-hover");
        lbl.current?.classList.add("is-hover");
        setLabel(
          el.getAttribute("data-cursor-label") ||
            (el.matches("a,button") ? "exec" : "open"),
        );
      } else {
        cur.current?.classList.remove("is-hover");
        lbl.current?.classList.remove("is-hover");
        setLabel("");
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
    };
  }, []);
  return (
    <>
      <div className="cursor" ref={cur}></div>
      <div className="cursor-label" ref={lbl}>
        {label}
      </div>
    </>
  );
}

/* ===== loader ===== */
function Loader() {
  const [n, setN] = useState(0),
    [hide, setHide] = useState(false);
  useEffect(() => {
    let i = 0;
    const step = () => {
      i += Math.random() * 9 + 4;
      if (i >= 100) {
        setN(100);
        setTimeout(() => setHide(true), 340);
        return;
      }
      setN(Math.floor(i));
      setTimeout(step, 40 + Math.random() * 50);
    };
    step();
  }, []);
  return (
    <div className={"loader" + (hide ? " hide" : "")} role="status" aria-label="Loading Prompt Goblin" aria-live="polite">
      <div>
        <div style={{ marginBottom: 12, color: "var(--muted)" }}>
          $ goblin crawl --self
        </div>
        <div className="count">
          {String(n).padStart(3, "0")}
          <em>%</em>
        </div>
      </div>
      <div className="right">
        <div>indexing</div>
        <div>
          <b>schema valid</b>
        </div>
        <div>v 26.05.28</div>
      </div>
    </div>
  );
}

/* ===== HUD ===== */
function HUDTop({ theme, setTheme }) {
  const t = useLocalTime();
  const time = t.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Chicago",
  });
  return (
    <header className="hud hud-top" role="banner">
      <div className="hud-left">
        <a className="logo" href="#top" data-cursor-label="home">
          <span className="logo-mark">
            <GoblinHead size={24} />
          </span>
          <span>Prompt_Goblin&#x2122;</span>
        </a>
        <span className="hud-divider" aria-hidden="true"></span>
        <span className="muted" aria-hidden="true">AI&nbsp;SEO / Chicago</span>
      </div>
      <nav className="hud-center hud-menu" aria-label="Site navigation">
        <a href="#scan">./scan</a>
        <a href="#work">./work</a>
        <a href="#services">./services</a>
        <a href="#pricing">./pricing</a>
        <a href="#contact">./summon</a>
      </nav>
      <div className="hud-right">
        <button
          className="theme-tog"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          data-cursor-label="theme"
          title="Toggle light / dark"
          aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
        >
          <span className="sw" aria-hidden="true"></span>
          <span className="lbl">{theme === "light" ? "LIGHT" : "DARK"}</span>
        </button>
        <span className="hud-divider" aria-hidden="true"></span>
        <span aria-hidden="true">
          <span className="dot"></span>&nbsp;VISIBLE&nbsp;AF
        </span>
        <span className="hud-divider" aria-hidden="true"></span>
        <span aria-hidden="true">{time} CHI</span>
      </div>
    </header>
  );
}
function HUDBottom({ section, total, name }) {
  return (
    <footer className="hud hud-bot" role="contentinfo">
      <div className="hud-left">
        <span className="muted" aria-hidden="true">41.88&#xb0;N &middot; 87.63&#xb0;W</span>
      </div>
      <div className="hud-center" aria-hidden="true">
        <span className="muted">SECTOR &mdash;</span>
        <span>
          {String(section).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <span>{name}</span>
      </div>
      <div className="hud-right">
        <span className="muted" aria-hidden="true">EN_US</span>
        <span className="hud-divider" aria-hidden="true"></span>
        <a href="#top" aria-label="Back to top">&#x2191; top</a>
      </div>
    </footer>
  );
}

/* ===== HERO ===== */
function Hero() {
  const ref = useReveal();
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 4200);
    return () => clearInterval(id);
  }, []);
  return (
    <section
      id="top"
      className="panel hero"
      data-screen-label="01 Hero"
      data-section-name="Hero"
    >
      <div className="win-bar">
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="grow">promptgoblin &#x2014; ~/site &#x2014; zsh &#x2014; 132&#xd7;42</span>
        <span aria-hidden="true">&#x2325;&#x2318;</span>
      </div>
      <div className="hero-grid">
        <div className="hero-main reveal" ref={ref}>
          <div className="hero-kicker">
            <span className="b" aria-hidden="true"></span> AEO &middot; Technical SEO &middot; Accessibility
          </div>
          <h1 className="hero-title">
            Get found by robots.<br />
            <span className="g">Stay usable by humans.</span>
          </h1>
          <div className="hero-sub">
            When an AI names the best in your category &#x2014; is it you, or your competitor?
            <br />We measure that gap. Then we close it.<span className="cur" aria-hidden="true"></span>
          </div>
          <div className="hero-note">
            A one-goblin shop: AEO, technical SEO, and accessibility &#x2014; all three, because they&rsquo;re
            all the same problem: being readable and credible to every machine that matters.
            <br />
            <strong>Visible AF.</strong> No auto-deploys. No surprise invoices. No PDFs you implement yourself.
          </div>
          <div className="hero-cta">
            <a className="btn" href="#scan" data-cursor-label="scan">
              run my free scan <span className="arr">&#x2192;</span>
            </a>
            <a className="btn ghost" href="#how-it-works" data-cursor-label="learn">
              see how it works
            </a>
          </div>
          <div className="hero-guarantee">
            Free scan, no card. Paid work backed by a 100% money-back guarantee &#x2014; on the work, not a citation number (nobody can honestly guarantee that).
          </div>
        </div>
        <div className="hero-side">
          <div className={"goblin-art" + (blink ? " blink" : "")}>
            <GoblinHead />
          </div>
          <div className="goblin-cap">
            <span className="bk" aria-hidden="true">&#x25b8;</span> mascot.exe &#x2014; online
          </div>
          <div className="hero-side-signals" aria-hidden="true">
            <div className="hss-row"><span className="hss-engine">ChatGPT</span><span className="hss-bar"><i style={{width:"22%"}}></i></span></div>
            <div className="hss-row"><span className="hss-engine">Claude</span><span className="hss-bar"><i style={{width:"18%"}}></i></span></div>
            <div className="hss-row"><span className="hss-engine">Gemini</span><span className="hss-bar"><i style={{width:"15%"}}></i></span></div>
            <div className="hss-row"><span className="hss-engine">Perplexity</span><span className="hss-bar"><i style={{width:"12%"}}></i></span></div>
            <div className="hss-row"><span className="hss-engine">AI Overviews</span><span className="hss-bar"><i style={{width:"9%"}}></i></span></div>
            <div className="hss-label">// citation share before &rarr; grow it</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== HOW IT WORKS — the 6-step engine ===== */
const ENGINE_STEPS = [
  {
    num: "01",
    title: "We ask your customer's question across five AI engines",
    body: "Not keyword tools — real buyer queries sampled live from ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews. We capture who gets cited, and for what.",
  },
  {
    num: "02",
    title: "We map the gap: you vs. your competitor",
    body: "Every source the AI cited in your category gets logged. Then we diff it against your domain — so you see exactly which brands are eating your lunch, and why.",
  },
  {
    num: "03",
    title: "One audit: SEO, AEO, and accessibility in a single pass",
    body: "Missing schema. Thin content. Broken crawl paths. WCAG violations. All surfaced together, across real rendered page states — not a static snapshot. What breaks a screen reader often breaks an AI crawler too.",
  },
  {
    num: "04",
    title: "Every gap becomes a ranked, scoped fix",
    body: "Impact vs. effort. Paste-ready. Prioritized so you know what to do first. No 200-item checklist that collects dust.",
  },
  {
    num: "05",
    title: "A human reviews every change before it ships",
    body: "The system finds and ranks. A human goblin approves. Nothing auto-deploys — not schema, not content, not a comma. Agentic, but accountable.",
  },
  {
    num: "06",
    title: "It re-runs on a schedule. You see the delta.",
    body: "The pipeline loops on a cadence. Each run produces a before/after scorecard. Visibility, citations, SEO health, and accessibility coverage become tracked numbers — not a one-time vibe check.",
  },
];

function HowItWorks() {
  const ref = useReveal();
  return (
    <section
      id="how-it-works"
      className="panel"
      data-screen-label="02 How it works"
      data-section-name="How it works"
    >
      <div className="panel-bar">
        <span className="id">&#x25b8;</span>
        <span>// how it works &middot; the engine under the hood</span>
        <span className="grow"></span>
        <span className="tk">automated system &middot; human judgment &middot; measurable results</span>
      </div>
      <div className="hiw-layout">
        <div className="hiw-intro reveal" ref={ref}>
          <h2 className="hiw-head">How we actually move the needle</h2>
          <p className="hiw-body">
            Most SEO shops send you a PDF. We run a system.
          </p>
          <p className="hiw-body">
            Under the hood: one automated pipeline that finds gaps across answer-engine visibility, technical SEO,
            and accessibility &#x2014; with bounded self-healing loops and an eval gate that proves a fix actually
            works before any human sees it. Then a human reviews every recommended change. Then it ships. Then
            the system re-runs on a schedule and measures the delta.
          </p>
          <p className="hiw-body">
            You see the gap. Then you watch it close.
          </p>
          <div className="hiw-disciplines">
            <div className="hiw-disc">
              <span className="hiw-disc-nm">AEO</span>
              <span className="hiw-disc-lv">answer-engine visibility</span>
              <span className="hiw-disc-sub">Get cited inside ChatGPT, Claude, Gemini, Perplexity &amp; AI Overviews. The real levers are brand mentions and Bing rank.</span>
            </div>
            <div className="hiw-disc">
              <span className="hiw-disc-nm">SEO</span>
              <span className="hiw-disc-lv">technical foundation</span>
              <span className="hiw-disc-sub">Crawlability, indexation, Core Web Vitals, schema hygiene. The ground AEO stands on.</span>
            </div>
            <div className="hiw-disc">
              <span className="hiw-disc-nm">A11Y</span>
              <span className="hiw-disc-lv">WCAG 2.1 AA + Section 508</span>
              <span className="hiw-disc-sub">Accessible to people on assistive tech, parseable by every crawler. The same fix helps both.</span>
            </div>
          </div>
        </div>
        <ol className="hiw-steps" aria-label="Six steps of the pipeline">
          {ENGINE_STEPS.map((s, i) => (
            <HiwStep key={s.num} s={s} i={i} />
          ))}
        </ol>
      </div>
      <div className="hiw-footer">
        <span className="hiw-footer-label">// the technical name for the system:</span>
        <span className="hiw-footer-val">a self-healing RAG pipeline on a CI/CD eval gate &mdash; automated system finds gaps, proves fixes work, a human ships them, you watch the numbers move.</span>
      </div>
    </section>
  );
}

function HiwStep({ s, i }) {
  const ref = useReveal();
  return (
    <li
      className="hiw-step reveal"
      ref={ref}
      style={{ transitionDelay: `${i * 0.07}s` }}
    >
      <div className="hiw-sn" aria-hidden="true">{s.num}</div>
      <div className="hiw-sc">
        <div className="hiw-st">{s.title}</div>
        <div className="hiw-sd">{s.body}</div>
      </div>
    </li>
  );
}

/* ===== LIVE SCAN — goblin@visibility-mesh terminal ===== */
let __scanUid = 0;
function scanScript(domain) {
  const clean = (domain || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const brand = clean || "your brand";
  return [
    {
      t: "cmd",
      text: "goblin scan --surface llm" + (clean ? " --domain " + clean : ""),
    },
    {
      t: "kv",
      k: "query",
      v: clean
        ? '"best ' + clean + ' alternative"'
        : '"best enterprise fleet software"',
    },
    { t: "info", text: "checking ChatGPT / Claude / Gemini / Perplexity" },
    { t: "info", text: "↳ retrieving citation graph [illustrative]" },
    { t: "warn", text: "competitor cited \xb7 you're not — [sample output]" },
    { t: "err", text: brand + ": 0 mentions \xb7 invisibility cloak ACTIVE" },
    { t: "sep" },
    { t: "issue", sev: "HIGH", text: "weak off-site citation graph" },
    { t: "issue", sev: "MED", text: "missing Organization + Service schema" },
    {
      t: "issue",
      sev: "MED",
      text: "thin comparison content (vs. 6 competitors)",
    },
    {
      t: "issue",
      sev: "MED",
      text: "no LLM-readable proof pages or trust assets",
    },
    { t: "sep" },
    {
      t: "ok",
      text: "goblin.recommend → schema + citation assets + intent pages",
    },
    { t: "ok", text: "invisibility cloak: BREAKABLE" },
  ];
}

/* Visibility Spectrum — 5 engine bars replacing the left-side node graph */
const SPECTRUM_ENGINES = [
  { name: "ChatGPT",     pct: 22 },
  { name: "Claude",      pct: 18 },
  { name: "Gemini",      pct: 15 },
  { name: "Perplexity",  pct: 12 },
  { name: "AI Overviews",pct:  9 },
];

function VisibilitySpectrum() {
  const [lit, setLit] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { setLit(true); io.unobserve(e.target); } }),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="vs-wrap" ref={ref} aria-label="Visibility spectrum — citation share by AI engine (illustrative sample)">
      <div className="vs-head">
        <span className="vs-kicker">// visibility spectrum &middot; illustrative</span>
        <span className="vs-note">enter your domain for a real scan</span>
      </div>
      <div className="vs-bars" role="list">
        {SPECTRUM_ENGINES.map((e) => (
          <div className="vs-row" key={e.name} role="listitem">
            <span className="vs-name">{e.name}</span>
            <div className="vs-bar" role="presentation">
              <div
                className={"vs-fill" + (lit ? " lit" : "")}
                style={{ "--pct": e.pct + "%" }}
              ></div>
            </div>
            <span className="vs-pct" aria-label={e.pct + "% sample citation share"}>
              {lit ? e.pct + "%" : "0%"}
            </span>
          </div>
        ))}
      </div>
      <div className="vs-footer">
        <span>&#x26A0; sample data &mdash; your domain&rsquo;s real citations replace these numbers after a scan</span>
      </div>
    </div>
  );
}

function LiveScan() {
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState("cursed");
  const [pct, setPct] = useState(0);
  const [target, setTarget] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [reportLines, setReportLines] = useState(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    const script = target && reportLines ? reportLines : scanScript(target);
    let i = 0,
      cancelled = false,
      timer;
    const tick = () => {
      if (cancelled) return;
      if (i >= script.length) {
        setStatus("fixable");
        if (target) {
          setDone(true);
          return;
        }
        timer = setTimeout(() => {
          setLines([]);
          setStatus("cursed");
          setPct(0);
          i = 0;
          timer = setTimeout(tick, 1400);
        }, 4200);
        return;
      }
      setLines((p) => [...p, { ...script[i], id: __scanUid++ }]);
      setPct(Math.round(((i + 1) / script.length) * 100));
      i++;
      timer = setTimeout(tick, 300 + Math.random() * 220);
    };
    setLines([]);
    setStatus("cursed");
    setPct(0);
    timer = setTimeout(tick, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [target, reportLines]);

  const onScan = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (data.botcheck) return;
    const domain = (data.domain || "").trim();
    const competitor = (data.competitor || "").trim();
    const scanId = "scan_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    data.scan_id = scanId;
    captureLead("free_scan_requested", {
      domain,
      email: data.email,
      competitor,
      scan_id: scanId,
    });
    setEmail(data.email || "");
    setDone(false);
    setReportLines(null);

    const report = await runHygieneScan(domain);
    if (report && report.ok) {
      setReportLines(reportToTerminal(report));
      try {
        window.posthog &&
          window.posthog.capture("scan_result_shown", {
            scan_id: scanId,
            domain,
            hygiene_score: report.report && report.report.hygieneScore,
            findings: report.report && (report.report.findings || []).length,
          });
      } catch (_) {}
    }
    setTarget(domain);

    if (!competitor) {
      captureEvent("tier2_skipped_no_competitor", { scan_id: scanId, domain });
    } else {
      runCitationTeaser({ email: data.email, domain, competitor }).then((tier2) => {
        if (!tier2) {
          captureEvent("tier2_error", { scan_id: scanId, domain, competitor, reason: "network_or_unreachable" });
          return;
        }
        if (tier2.ok && tier2.configured && tier2.teaser) {
          const results = tier2.teaser.results || [];
          captureEvent("tier2_result_shown", {
            scan_id: scanId,
            domain,
            competitor,
            engine: tier2.teaser.engine || "perplexity",
            queries: results.length,
            client_cited_count: results.filter((r) => r.clientCited).length,
            competitor_cited_count: results.filter((r) => r.competitorCited).length,
          });
        } else if (tier2.ok && tier2.configured === false) {
          captureEvent("tier2_no_key", { scan_id: scanId, domain, competitor });
        } else if (tier2.retryAfterHours) {
          captureEvent("tier2_rate_limited", {
            scan_id: scanId,
            domain,
            competitor,
            retry_after_hours: tier2.retryAfterHours,
          });
        } else {
          captureEvent("tier2_error", {
            scan_id: scanId,
            domain,
            competitor,
            status: tier2.error || "unknown",
          });
        }
      });
    }
  };

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <section
      id="scan"
      className="panel"
      data-screen-label="03 Scan"
      data-section-name="Are you citable?"
    >
      <div className="panel-bar">
        <span className="id">&#x25b8;</span>
        <span>$ goblin scan --surface llm</span>
        <span className="grow"></span>
        <span className="tk">
          {target && reportLines
            ? "live \xb7 real scan"
            : "sample \xb7 enter your domain for a real scan"}
        </span>
      </div>
      <div className="grid-lines scan-layout">
        <div className="scan-spectrum-col">
          <VisibilitySpectrum />
        </div>
        <div className="scan-term">
          <div className="win-bar">
            <span className="dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="grow">goblin@visibility-mesh &#x2014; /scan</span>
            <span aria-hidden="true">{String(pct).padStart(3, "0")}%</span>
          </div>
          <div className="scan-body" ref={bodyRef} role="log" aria-label="Scan terminal output">
            {lines.map((l) => (
              <div className="scan-ln" key={l.id}>
                {l.t === "cmd" && (
                  <>
                    <span className="pfx" aria-hidden="true">$</span> {l.text}
                  </>
                )}
                {l.t === "info" && (
                  <>
                    <span className="pfx" aria-hidden="true">&#x203a;</span>{" "}
                    <span className="mu">{l.text}</span>
                  </>
                )}
                {l.t === "kv" && (
                  <>
                    <span className="pfx" aria-hidden="true">&#x203a;</span>{" "}
                    <span className="key">{l.k}:</span>{" "}
                    <span className="mu">{l.v}</span>
                  </>
                )}
                {l.t === "warn" && (
                  <>
                    <span className="warn" aria-hidden="true">&#x25b2;</span>{" "}
                    <span className="warn">{l.text}</span>
                  </>
                )}
                {l.t === "err" && (
                  <>
                    <span className="err" aria-hidden="true">&#x2715;</span>{" "}
                    <span className="err">{l.text}</span>
                  </>
                )}
                {l.t === "issue" && (
                  <>
                    <span className={l.sev === "HIGH" ? "err" : "mu"} aria-hidden="true">
                      {l.sev === "HIGH" ? "▲" : "\xb7"}
                    </span>{" "}
                    <span className="sev">[{l.sev}]</span>{" "}
                    <span className="mu">{l.text}</span>
                  </>
                )}
                {l.t === "ok" && (
                  <>
                    <span className="ok" aria-hidden="true">&#x2713;</span>{" "}
                    <span className="ok">{l.text}</span>
                  </>
                )}
                {l.t === "sep" && (
                  <span className="mu sep" aria-hidden="true">
                    &#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;&#x2014;
                  </span>
                )}
              </div>
            ))}
            <div className="scan-ln">
              <span className="pfx" aria-hidden="true">$</span> <span className="scan-cur" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className="scan-side">
          {!done ? (
            <form className="scan-form" onSubmit={onScan} aria-label="Free visibility scan">
              <div className="sf-lbl" id="scan-form-label">$ run a free scan &#x2014; no card required</div>
              <label className="sr-only" htmlFor="scan-domain">Your domain</label>
              <input
                id="scan-domain"
                name="domain"
                required
                placeholder="yourbrand.com"
                autoComplete="url"
                aria-describedby="scan-form-label"
              />
              <label className="sr-only" htmlFor="scan-email">Your email</label>
              <input
                id="scan-email"
                name="email"
                type="email"
                required
                placeholder="you@brand.com"
                autoComplete="email"
              />
              <label className="sr-only" htmlFor="scan-competitor">A competitor (optional)</label>
              <input
                id="scan-competitor"
                name="competitor"
                placeholder="a competitor (optional)"
                autoComplete="off"
              />
              <input
                type="text"
                name="botcheck"
                className="sf-hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <button className="btn" type="submit" data-cursor-label="scan">
                run my free scan <span className="arr">&#x2192;</span>
              </button>
              <div className="scan-disclaimer">
                Instant result: a technical-hygiene scan &#x2014; schema, crawl &amp;
                structured-data gaps. Add your email and we&rsquo;ll follow up with a
                Perplexity citation teaser. The full multi-engine audit (ChatGPT
                &middot; Claude &middot; Gemini &middot; Perplexity &middot; AI Overviews) plus SEO &amp;
                accessibility ships with a paid Scout audit.
              </div>
            </form>
          ) : (
            <div className="sf-ok" role="status">
              <div className="sf-ok-mark" aria-hidden="true">&#x2713;</div>
              <div>
                <div className="sf-ok-t">
                  scan queued for {target}
                </div>
                <div className="sf-ok-d">
                  Your hygiene scan is queued and a Perplexity citation teaser is
                  on its way to {email || "your inbox"}. The terminal above is an
                  illustrative sample &#x2014; the full multi-engine audit across all
                  five answer engines, plus SEO &amp; accessibility, is the paid
                  Scout audit.
                </div>
              </div>
            </div>
          )}
          <div className="scan-status-row">
            <span className="k">visibility status</span>
            <span className={"scan-pill " + status} role="status">
              {status === "cursed" ? "✕ cursed" : "⚡ fixable"}
            </span>
          </div>
          <div className="scan-id" aria-live="polite">
            scan id &middot; GBL-{(pct * 73 + 1031).toString(16).toUpperCase()}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== CREDENTIALS / PROOF ===== */
function Credentials() {
  const ref = useReveal();
  return (
    <section
      id="work"
      className="panel"
      data-screen-label="04 Credentials"
      data-section-name="Credentials"
    >
      <div className="panel-bar">
        <span className="id">&#x25b8;</span>
        <span>// credentials &middot; the work behind the goblin</span>
        <span className="grow"></span>
        <span className="tk">WCAG &middot; Section 508 &middot; public sector</span>
      </div>
      <div className="cred-grid">
        <div className="cred-left reveal" ref={ref}>
          <h2 className="cred-head">Built for the hardest rooms.</h2>
          <p className="cred-sub">We&rsquo;ve shipped accessible software where it had to be right.</p>
          <p className="cred-lead">
            Accessibility and technical work delivered for public-sector programs including:
          </p>
          <ul className="cred-chips" aria-label="Public sector clients">
            <li><span aria-hidden="true">&#x25b8;</span> USDA</li>
            <li><span aria-hidden="true">&#x25b8;</span> City of Chicago</li>
            <li><span aria-hidden="true">&#x25b8;</span> State of Texas</li>
            <li><span aria-hidden="true">&#x25b8;</span> State of Illinois</li>
          </ul>
          <p className="cred-body">
            That&rsquo;s not a client logo wall. It means this shop has shipped accessible software where
            Section 508 wasn&rsquo;t optional, audited by real compliance reviewers, and delivered under
            scrutiny most agencies never face. We bring the same standard to your site.
          </p>
        </div>
        <div className="cred-right">
          <div className="cred-term">
            <div className="win-bar">
              <span className="dots" aria-hidden="true"><i /><i /><i /></span>
              <span className="grow">DOGFOOD &middot; LIVE SCAN &middot; HONEST BASELINE</span>
            </div>
            <div className="cred-term-body">
              <div className="cred-ln"><span className="pfx" aria-hidden="true">$</span> goblin scan --domain promptgoblin.zatgeist.com</div>
              <div className="cred-ln"><span className="mu">// engines: ChatGPT + Claude &middot; 8 buyer queries</span></div>
              <div className="cred-ln"><span className="warn" aria-hidden="true">&#x26a0;</span> <span className="warn">client cited: 0% &nbsp;(so is the competitor)</span></div>
              <div className="cred-ln"><span className="mu">// engines cite semrush, ahrefs, moz, hubspot instead</span></div>
              <div className="cred-ln"><span className="ok" aria-hidden="true">&#x2713;</span> <span className="ok">fixes queued: schema &middot; citation &middot; content</span></div>
              <div className="cred-ln"><span className="ok" aria-hidden="true">&#x2713;</span> <span className="ok">re-scan in 2 wks &#x2192; measured delta, not a promise</span></div>
              <div className="cred-sep" aria-hidden="true"></div>
              <div className="cred-note">
                We scanned ourselves first. 0% cited is the real number &#x2014; a trust asset, not a weakness.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== SERVICES ===== */
const SVCS = [
  {
    num: "(i)",
    title: "Technical SEO",
    lead: "Search engines and AI crawlers can reach every page. No crawl budget wasted, no pages orphaned, no signals leaking.",
    items: ["Crawl audits", "Indexation", "Canonicals", "Robots & sitemaps"],
  },
  {
    num: "(ii)",
    title: "Schema & Structured Data",
    lead: "JSON-LD so crawlers and models parse who you are without guessing. Table-stakes hygiene &#x2014; necessary, not magic. The citation levers are brand mentions and Bing rank; this clears the way.",
    items: ["JSON-LD", "Entity markup", "FAQ / HowTo", "Rich results"],
  },
  {
    num: "(iii)",
    title: "AI / Answer-Engine SEO",
    lead: "Get named inside ChatGPT, Perplexity, and AI Overviews &#x2014; by earning the brand mentions and Bing-rank signals those engines trust, plus the llms.txt and AEO hygiene that lets them through.",
    items: ["llms.txt", "AEO strategy", "Citation-acquisition", "RAG-readiness"],
  },
  {
    num: "(iv)",
    title: "Core Web Vitals",
    lead: "Fast for humans. Fast for bots. Green scores on the metrics Google and AI crawlers actually check.",
    items: ["LCP / CLS / INP", "Asset budgets", "Edge & caching", "Lab + field"],
  },
  {
    num: "(v)",
    title: "Content for Robots + Humans",
    lead: "Pages that answer the question a person is asking and that a language model can quote cleanly. Both audiences, one draft.",
    items: ["Info architecture", "Heading logic", "Internal links", "Editorial passes"],
  },
  {
    num: "(vi)",
    title: "Accessibility (WCAG + 508)",
    lead: "Usable by people on assistive tech. Required if you sell to government. The same fixes that help a screen reader help an AI crawler. Automated axe-core audit across real component states plus a human pass &#x2014; never sold as compliance-by-checkbox.",
    items: ["WCAG 2.1 AA + Section 508", "Stateful axe-core audit", "Human-reviewed remediation", "Reviewed fix PRs"],
  },
];

function Services() {
  const [open, setOpen] = useState(0);
  return (
    <section
      id="services"
      className="panel"
      data-screen-label="05 Services"
      data-section-name="Services"
    >
      <div className="panel-bar">
        <span className="id">&#x25b8;</span>
        <span>$ what we actually do</span>
        <span className="grow"></span>
        <span className="tk">six services &middot; one goblin</span>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        {SVCS.map((s, i) => (
          <div
            key={s.num}
            className={"svc-row" + (open === i ? " open" : "")}
            onClick={() => setOpen(open === i ? -1 : i)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(open === i ? -1 : i); } }}
            data-cursor-label={open === i ? "close" : "open"}
            role="button"
            tabIndex={0}
            aria-expanded={open === i}
            aria-label={s.title}
          >
            <div className="num" aria-hidden="true">{s.num}</div>
            <div className="ttl">
              {s.title
                .split(" ")
                .map((w, idx) =>
                  idx === 0 ? (
                    <em key={idx}>{w} </em>
                  ) : (
                    <span key={idx}>{w} </span>
                  ),
                )}
            </div>
            <div>
              <div className="lead" dangerouslySetInnerHTML={{ __html: s.lead }}></div>
              <div className="desc">
                <ul>
                  {s.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="tog" aria-hidden="true">+</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===== DASHBOARD TEASER ===== */
function DashboardTeaser() {
  const ref = useReveal();
  return (
    <section
      id="dashboard"
      className="panel"
      data-screen-label="06 Dashboard"
      data-section-name="Dashboard"
    >
      <div className="panel-bar">
        <span className="id">&#x25b8;</span>
        <span>// client dashboard &middot; in development</span>
        <span className="grow"></span>
        <span className="tk">coming Q3 2026 &middot; early clients get access first</span>
      </div>
      <div className="dash-layout">
        <div className="dash-copy reveal" ref={ref}>
          <h2 className="dash-head">You see the gap. Then you watch it close.</h2>
          <p className="dash-body">
            Every client on a recurring plan gets a dashboard. Not a vanity report &#x2014; a before/after scorecard.
          </p>
          <ul className="dash-list">
            <li><span className="dash-bullet" aria-hidden="true">&#x25b8;</span> Citation rate per AI engine (ChatGPT, Perplexity, Claude, Gemini, AI Overviews) &#x2014; measured per re-run, never estimated</li>
            <li><span className="dash-bullet" aria-hidden="true">&#x25b8;</span> You vs. your named competitor, on the queries that matter to your business</li>
            <li><span className="dash-bullet" aria-hidden="true">&#x25b8;</span> The fix queue: what&rsquo;s approved, what&rsquo;s shipped, what&rsquo;s pending your review</li>
            <li><span className="dash-bullet" aria-hidden="true">&#x25b8;</span> Technical SEO and accessibility health over time</li>
          </ul>
          <p className="dash-note">
            The gap is the baseline. Every re-run loop is a measured delta &#x2014; movement, never a guaranteed citation number.
            You&rsquo;re not buying our word for it; you&rsquo;re buying a system that shows its receipts.
          </p>
        </div>
        <div className="dash-preview" aria-label="Dashboard preview — sample data, not live">
          <div className="dash-preview-bar">
            <span className="dash-preview-label">// sample data &#x2014; illustrative</span>
            <span className="dash-status-badge">in development</span>
          </div>
          <div className="dash-mock">
            <div className="dash-mock-kpi">
              <div className="dash-kpi-label">CITATION RATE</div>
              <div className="dash-kpi-val">&gt;_ <span>&#x2014;%</span></div>
              <div className="dash-kpi-sub">// populated after your first real scan</div>
            </div>
            <div className="dash-mock-rows">
              {[
                { engine: "ChatGPT",      before: "0%", after: "&#x2014;" },
                { engine: "Perplexity",   before: "0%", after: "&#x2014;" },
                { engine: "Claude",       before: "0%", after: "&#x2014;" },
                { engine: "Gemini",       before: "0%", after: "&#x2014;" },
                { engine: "AI Overviews", before: "0%", after: "&#x2014;" },
              ].map((r) => (
                <div className="dash-mock-row" key={r.engine}>
                  <span className="dme">{r.engine}</span>
                  <span className="dmb">{r.before}</span>
                  <span className="dma" aria-label="after — pending scan" dangerouslySetInnerHTML={{ __html: r.after }}></span>
                </div>
              ))}
            </div>
            <div className="dash-mock-gate">
              <span className="dash-gate-icon" aria-hidden="true">&#x1F512;</span>
              <span>human review gate &#x2014; nothing ships unactioned</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== PRICING ===== */
const TIERS = [
  {
    key: "scout",
    name: "Goblin Scout",
    who: "founders & solo operators",
    price: "2,950",
    interval: "one-time",
    link: STRIPE_LINKS.scout,
    cta: "Hire a Scout",
    desc: "A full visibility audit that ships as reviewed fixes — not a PDF you implement yourself. You get the citation diff, the ranked fix queue, and a 60-minute walkthrough. Done.",
    bullets: [
      "Full LLM citation audit \xb7 5 AI surfaces",
      "Schema + entity gap report",
      "Competitor citation diff — who they’re citing instead of you, and why",
      "Ranked fix queue \xb7 scored by impact \xd7 effort",
      "60-min goblin office hour",
    ],
  },
  {
    key: "warband",
    name: "Goblin Warband",
    who: "scaleups w/ a marketing team",
    price: "4,800",
    interval: "/ mo",
    link: STRIPE_LINKS.warband,
    cta: "Summon Warband",
    featured: true,
    tag: "best value",
    desc: "The automated system runs every week. Reviewed PRs land in your repo or CMS. You approve changes. A goblin is on Slack within 24 hours. You watch the scorecard move.",
    bullets: [
      "Everything in Scout",
      "Weekly automated re-runs of the full pipeline",
      "Citation-acquisition campaigns — building the brand mentions that actually move citations",
      "Schema + content fix PRs to your repo or CMS",
      "Slack access \xb7 <24-hour response",
      "Live visibility dashboard [coming Q3 2026]",
    ],
  },
  {
    key: "warlord",
    name: "Goblin Warlord",
    who: "agencies, ecomm, multi-brand",
    price: "12,500",
    interval: "/ mo",
    link: STRIPE_LINKS.warlord,
    cta: "Forge Warlord",
    desc: "The full goblin system running across up to 8 domains. Custom workflows, dedicated retrieval infrastructure, white-label deliverables. You embed the goblin.",
    bullets: [
      "Everything in Warband",
      "Up to 8 domains / brands in one pipeline",
      "Custom LangGraph workflows built for your category",
      "Dedicated retrieval mesh",
      "Quarterly strategy summit",
      "White-label deliverables",
    ],
  },
];

function Pricing() {
  const click = (t) => {
    try {
      window.posthog &&
        window.posthog.capture("checkout_clicked", {
          tier: t.key,
          tier_name: t.name,
          price_usd: Number(String(t.price).replace(/[^0-9.]/g, "")) || 0,
          interval: t.interval,
        });
    } catch (_) {}
  };
  return (
    <section
      id="pricing"
      className="panel"
      data-screen-label="07 Pricing"
      data-section-name="Pricing"
    >
      <div className="panel-bar">
        <span className="id">&#x25b8;</span>
        <span>$ goblin --pricing</span>
        <span className="grow"></span>
        <span className="tk">flat fee &middot; no credits &middot; no sales call</span>
      </div>
      <div className="pricing-intro">
        Pick your tier. Pay once or monthly. No retainer trap &#x2014; Scout is a single engagement you can re-up. Warband and Warlord are the recurring loop.
      </div>
      <div className="grid-lines pricing-grid">
        {TIERS.map((t) => (
          <div
            key={t.key}
            className={"ptier" + (t.featured ? " featured" : "")}
          >
            {t.tag && <span className="ptag">{t.tag}</span>}
            <div className="pname">{t.name}</div>
            <div className="pwho">// {t.who}</div>
            <div className="pprice">
              ${t.price}
              <small>{t.interval}</small>
            </div>
            <div className="pdesc">{t.desc}</div>
            <ul className="pfeat">
              {t.bullets.map((b) => (
                <li key={b}>
                  <span className="c" aria-hidden="true">&#x25b8;</span> {b}
                </li>
              ))}
            </ul>
            <a
              className={"btn" + (t.featured ? "" : " ghost")}
              href={t.link}
              data-cursor-label="checkout"
              onClick={() => click(t)}
            >
              {t.cta} <span className="arr">&#x2192;</span>
            </a>
          </div>
        ))}
      </div>
      <div className="penterprise">
        <span>
          <strong style={{ color: "var(--lime)" }}>&#x2713; 100% money-back guarantee</strong>{" "}
          &#x2014; on the work, not the algorithm. If we don&rsquo;t deliver your audit, or you&rsquo;re not
          happy within 14 days, you get every dollar back. We won&rsquo;t promise a citation number
          (nobody honestly can) &#x2014; we guarantee the work and measure the rest straight.
        </span>
      </div>
      <div className="penterprise">
        <span>
          &#x25c6; enterprise &middot; multi-region &middot; regulated &#x2014; on-prem retrieval, custom
          auth, a goblin embedded in your team.
        </span>
        <a
          className="btn ghost"
          href="mailto:hi@promptgoblin.io"
          data-cursor-label="talk"
        >
          talk to a goblin <span className="arr">&#x2192;</span>
        </a>
      </div>
    </section>
  );
}

/* ===== CONTACT / SUMMON ===== */
function Contact() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const data = Object.fromEntries(new FormData(e.target).entries());
    identifyLead(data);
    captureEvent("summon_submitted", {
      domain: leadDomain(data),
      has_email: Boolean(data.email),
      target: data.target || "",
    });
    captureEvent("lead_recommendation_context", {
      domain: leadDomain(data),
      source_event: "summon_submitted",
      requested_surface: data.target || "",
    });
    setSending(true);
    if (WEB3FORMS_KEY.indexOf("REPLACE") !== -1) {
      console.info(
        "[summon] form backend not configured — captured locally:",
        data,
      );
      setSending(false);
      setSent(true);
      return;
    }
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: "New goblin summon ✦ " + (data.domain || ""),
          from_name: "promptgoblin.io",
          ...data,
        }),
      });
      if (res.ok) setSent(true);
      else
        setErr(
          "A goblin fumbled that send. Try again, or email hi@promptgoblin.io and we'll run it by hand.",
        );
    } catch (_) {
      setErr(
        "Couldn’t reach the server — check your connection and retry, or email hi@promptgoblin.io.",
      );
    }
    setSending(false);
  };

  return (
    <section
      id="contact"
      className="panel"
      data-screen-label="08 Summon"
      data-section-name="Summon"
    >
      <div className="panel-bar">
        <span className="id">&#x25b8;</span>
        <span>$ goblin --summon</span>
        <span className="grow"></span>
        <span className="tk">3 slots &middot; Q3&#x2013;Q4 2026</span>
      </div>
      <div className="grid-lines contact-grid">
        <div className="contact-main">
          <div className="big">
            <a href="#contact" data-cursor-label="summon">
              Summon<em>.</em>
              <span className="arr">&#x2192;</span>
            </a>
          </div>
          <div className="avail">
            Drop your domain and what you want to get cited for. A free visibility scan comes back within
            one working day &#x2014; schema, crawl gaps, and a Perplexity citation teaser showing you vs. a competitor.
            <br />
            <em>No card, no sales call.</em> Paid work carries a{" "}
            <em>100% money-back guarantee</em> &#x2014; full refund if we don&rsquo;t deliver or you&rsquo;re not happy within 14 days.
            Best for jobs measured in <em>days</em>, not quarters.
          </div>

          {!sent ? (
            <form className="summon-form" onSubmit={submit} aria-label="Summon a goblin">
              <div className="sf-grid">
                <label className="sf-field">
                  <span className="sf-lbl">$ domain</span>
                  <input
                    name="domain"
                    required
                    placeholder="yourbrand.com"
                    autoComplete="url"
                  />
                </label>
                <label className="sf-field">
                  <span className="sf-lbl">$ email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@brand.com"
                    autoComplete="email"
                  />
                </label>
              </div>
              <label className="sf-field">
                <span className="sf-lbl">$ get_cited_for</span>
                <input
                  name="target"
                  placeholder={'e.g. "best fleet software"'}
                />
              </label>
              <input
                type="text"
                name="botcheck"
                className="sf-hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <div className="sf-actions">
                <button
                  className="btn"
                  type="submit"
                  disabled={sending}
                  data-cursor-label="run scan"
                >
                  {sending ? "casting…" : "run my free scan"}{" "}
                  <span className="arr">&#x2192;</span>
                </button>
                <a
                  className="btn ghost"
                  href={STRIPE_SCOUT_LINK}
                  data-cursor-label="reserve"
                >
                  reserve a Scout audit
                </a>
              </div>
              {err && <div className="sf-err" role="alert">&#x26a0; {err}</div>}
            </form>
          ) : (
            <div className="sf-ok" role="status">
              <div className="sf-ok-mark" aria-hidden="true">&#x2713;</div>
              <div>
                <div className="sf-ok-t">
                  summon received &#x2014; invisibility cloak: BREAKING
                </div>
                <div className="sf-ok-d">
                  A real human-goblin replies within one working day with your free scan.
                  Check your inbox (and spam &#x2014; goblins lurk there too).
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="contact-side">
          <div className="cside-row">
            <span className="k">$ mail</span>
            <span className="v big">
              <a href="mailto:hi@promptgoblin.io">hi@promptgoblin.io</a>
            </span>
          </div>
          <div className="cside-row">
            <span className="k">$ chat</span>
            <span className="v">@promptgoblin</span>
          </div>
          <div className="cside-row">
            <span className="k">$ ls ./elsewhere</span>
            <span className="v">
              <span className="soon-link">github</span> &middot;{" "}
              <span className="soon-link">x.com</span> &middot;{" "}
              <span className="soon-link">substack</span>
            </span>
          </div>
          <div className="cside-row">
            <span className="k">$ pwd</span>
            <span className="v">Chicago, IL &middot; by appt</span>
          </div>
        </div>
      </div>
      <div className="colophon">
        <span>&#xa9; Prompt_Goblin&#x2122; 2024&#x2013;2026 &middot; Visible AF</span>
        <span>Get found. Stay readable. Ship the fix.</span>
      </div>
    </section>
  );
}

/* ===== MARQUEE ===== */
function Marquee() {
  const words = [
    "schema.org",
    "llms.txt",
    "crawlability",
    "structured data",
    "answer engines",
    "core web vitals",
    "entity SEO",
    "JSON-LD",
    "RAG-ready",
    "sitemaps",
    "Visible AF",
  ];
  const run = (
    <span>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span>{w}</span>
          <span className="sep" aria-hidden="true">&#x25aa;</span>
        </React.Fragment>
      ))}
    </span>
  );
  return (
    <section
      className="panel marquee"
      aria-hidden="true"
      data-screen-label="marquee"
      data-section-name="Keywords"
    >
      <div className="marquee-track">
        {run}
        {run}
        {run}
      </div>
    </section>
  );
}

/* ===== section spy ===== */
function useSectionSpy(ids) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const els = ids
      .map((id) => document.querySelector(`[data-screen-label="${id}"]`))
      .filter(Boolean);
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            const idx = ids.indexOf(e.target.getAttribute("data-screen-label"));
            if (idx >= 0) setActive(idx);
          }
        }),
      { threshold: 0.3 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return active;
}

/* ===== tweaks ===== */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  grain: true,
  cursor: true,
  motion: "med",
  density: "default",
  displaySize: "md",
}; /*EDITMODE-END*/

function TweaksMount() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  useEffect(() => {
    document.body.setAttribute("data-grain", t.grain ? "on" : "off");
    document.body.setAttribute("data-cursor", t.cursor ? "on" : "off");
    document.body.setAttribute("data-motion", t.motion);
    document.body.setAttribute("data-density", t.density);
    document.body.setAttribute("data-display", t.displaySize || "md");
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Type" />
      <TweakRadio
        label="Display size"
        value={t.displaySize}
        options={[
          { value: "sm", label: "Refined" },
          { value: "md", label: "Default" },
          { value: "lg", label: "Massive" },
        ]}
        onChange={(v) => setTweak("displaySize", v)}
      />

      <TweakSection label="Motion & layout" />
      <TweakRadio
        label="Motion"
        value={t.motion}
        options={[
          { value: "low", label: "Calm" },
          { value: "med", label: "Default" },
          { value: "high", label: "Loud" },
        ]}
        onChange={(v) => setTweak("motion", v)}
      />
      <TweakRadio
        label="Density"
        value={t.density}
        options={[
          { value: "tight", label: "Tight" },
          { value: "default", label: "Default" },
          { value: "airy", label: "Airy" },
        ]}
        onChange={(v) => setTweak("density", v)}
      />

      <TweakSection label="Atmosphere" />
      <TweakToggle
        label="Grain"
        value={t.grain}
        onChange={(v) => setTweak("grain", v)}
      />
      <TweakToggle
        label="Custom cursor"
        value={t.cursor}
        onChange={(v) => setTweak("cursor", v)}
      />
    </TweaksPanel>
  );
}

/* ===== app ===== */
const SECTIONS = [
  { id: "01 Hero",         name: "Hero" },
  { id: "02 How it works", name: "How it works" },
  { id: "03 Scan",         name: "Are you citable?" },
  { id: "04 Credentials",  name: "Credentials" },
  { id: "05 Services",     name: "Services" },
  { id: "06 Dashboard",    name: "Dashboard" },
  { id: "07 Pricing",      name: "Pricing" },
  { id: "08 Summon",       name: "Summon" },
];

function App() {
  const ids = SECTIONS.map((s) => s.id);
  const active = useSectionSpy(ids);
  const [theme, setTheme] = useTheme();
  return (
    <>
      <Loader />
      <Cursor />
      <div className="grain" aria-hidden="true"></div>
      <HUDTop theme={theme} setTheme={setTheme} />
      <main id="main-content">
        <div className="os">
          <Hero />
          <HowItWorks />
          <LiveScan />
          <Credentials />
          <Services />
          <DashboardTeaser />
          <Marquee />
          <Pricing />
          <Contact />
        </div>
      </main>
      <HUDBottom
        section={active + 1}
        total={SECTIONS.length}
        name={SECTIONS[active].name}
      />
      <TweaksMount />
    </>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
