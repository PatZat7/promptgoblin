/* global React, ReactDOM, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle, GoblinHead */
const { useState, useEffect, useRef, useCallback } = React;

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

// Tier-1 report -> terminal lines lives next to <LiveScan> below
// (SCAN_PHASES / phaseValues / phaseTone). Every phase resolves to a MEASURED
// value from the real report — never a fabricated one.

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
    // No custom cursor on touch / coarse-pointer devices — skip the rAF + listeners.
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return;
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
    <div className={"loader" + (hide ? " hide" : "")}>
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
    <div className="hud hud-top">
      <div className="hud-left">
        <a className="logo" href="#top" data-cursor-label="home">
          <span className="logo-mark">
            <GoblinHead size={24} />
          </span>
          <span>Prompt_Goblin™</span>
        </a>
        <span className="hud-divider"></span>
        <span className="muted">AI&nbsp;SEO / Chicago</span>
      </div>
      <div className="hud-center hud-menu">
        <a href="#scan">./scan</a>
        <a href="#work">./work</a>
        <a href="#services">./services</a>
        <a href="#pricing">./pricing</a>
        <a href="#contact">./summon</a>
      </div>
      <div className="hud-right">
        <button
          className="theme-tog"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          data-cursor-label="theme"
          title="Toggle light / dark"
        >
          <span className="sw"></span>
          <span className="lbl">{theme === "light" ? "LIGHT" : "DARK"}</span>
        </button>
        <span className="hud-divider"></span>
        <span>
          <span className="dot"></span>&nbsp;VISIBLE&nbsp;AF
        </span>
        <span className="hud-divider"></span>
        <span>{time} CHI</span>
      </div>
    </div>
  );
}
function HUDBottom({ section, total, name }) {
  return (
    <div className="hud hud-bot">
      <div className="hud-left">
        <span className="muted">41.88°N · 87.63°W</span>
      </div>
      <div className="hud-center">
        <span className="muted">SECTOR —</span>
        <span>
          {String(section).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </span>
        <span>{name}</span>
      </div>
      <div className="hud-right">
        <span className="muted">EN_US</span>
        <span className="hud-divider"></span>
        <span>↑ top</span>
      </div>
    </div>
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
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        <span className="grow">promptgoblin — ~/site — zsh — 132×42</span>
        <span>⌥⌘</span>
      </div>
      <div className="hero-grid">
        <div className="hero-main reveal" ref={ref}>
          <div className="hero-kicker">
            <span className="b"></span> Core positioning
          </div>
          <h1 className="hero-title">
            AI search
            <br />
            visibility &amp;
            <br />
            <span className="g">technical SEO</span>.
          </h1>
          <div className="hero-sub">
            Get found by robots.
            <br />
            Stay usable by humans.<span className="cur"></span>
          </div>
          <div className="hero-note">
            A one-goblin shop that makes you <b>Visible AF</b> — we measure who
            the answer engines actually cite for your category, then ship the
            schema, crawl, and content fixes (software-engineer-reviewed, never
            auto-deployed) to close the gap. Days, not quarters.
          </div>
          <div className="hero-note hero-gap-line">
            When an AI names the best in your category — is it you, or your
            competitor? We measure that gap. Then we close it.
          </div>
          <div className="hero-cta">
            <a className="btn" href="#contact" data-cursor-label="summon">
              ./summon <span className="arr">→</span>
            </a>
            <a className="btn ghost" href="#work" data-cursor-label="browse">
              ./see_work
            </a>
          </div>
          <div className="hero-note" style={{ marginTop: 14 }}>
            <b>✓ Free scan, no card.</b> Paid work backed by a 100% money-back
            guarantee.
          </div>
        </div>
        <div className="hero-side">
          <div className="ascii-noise ascii-tr">{`schema fragments: [
  "@type": "Org",
  > **nodes ........ }
**crawling graphs**
***(.......) "teh"*,
**objects .........
^animated paypaths^
............crable AF`}</div>
          <div className={"goblin-art" + (blink ? " blink" : "")}>
            <GoblinHead />
          </div>
          <div className="ascii-noise ascii-bl">{`> crawl ok
> index ok
> cite-ready ✓`}</div>
          <div className="goblin-cap">
            <span className="bk">▸</span> mascot.exe — online
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== SPELLBOOK — the three disciplines (AEO · SEO · Accessibility) ===== */
const SPELLS = [
  { ico: "fire", nm: "AEO", lv: "answer-engine visibility", sub: "Get cited inside ChatGPT, Claude, Gemini, Perplexity & AI Overviews." },
  { ico: "bolt", nm: "SEO", lv: "technical foundation", sub: "Crawl, index, schema, Core Web Vitals — the base AEO stands on." },
  { ico: "ice", nm: "A11Y", lv: "WCAG 2.1 AA + Section 508", sub: "Accessible to people and parseable by machines. Required for gov." },
];
function Spellbook() {
  const ref = useReveal();
  return (
    <section
      className="panel spellbook-sec"
      data-screen-label="02 Spellbook"
      data-section-name="Spellbook"
    >
      <div className="spellbook reveal" ref={ref}>
        <div className="sb-head">
          <span className="sb-title">
            Visibility Spellbook
          </span>
          <span className="sb-count">3 schools · 1 goblin</span>
        </div>
        <div className="sb-cards">
          {SPELLS.map((s) => (
            <div className="sb-card" key={s.nm} data-cursor-label="cast">
              <div className={"sb-ico ico-" + s.ico}>
                {s.ico === "fire" && <SpriteFire size={4} />}
                {s.ico === "ice" && <SpriteIce size={4} />}
                {s.ico === "bolt" && <SpriteLightning size={4} />}
              </div>
              <div className="sb-meta">
                <div className="nm">{s.nm}</div>
                <div className="lv">{s.lv}</div>
                <div className="sb-sub">{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="sb-foot">
          <span className="path">&gt; one stack: get found, stay legible, stay compliant</span>
          <span className="pct">v2</span>
        </div>
      </div>
    </section>
  );
}

/* ===== STATS ===== */
const STATS = [
  { v: "5", k: "Answer engines scanned" },
  { v: "6", k: "JSON-LD blocks · this site" },
  { v: "7", k: "Pipeline nodes · engineer-gated" },
  { v: "0", k: "Changes auto-deployed" },
];

function Stats() {
  return (
    <section
      className="panel"
      data-screen-label="06 Stats"
      data-section-name="Telemetry"
    >
      <div className="panel-bar">
        <span className="id">//</span>
        <span>telemetry</span>
        <span className="grow"></span>
        <span className="tk">this site · dogfooded</span>
      </div>
      <div className="grid-lines stats">
        {STATS.map((s, i) => (
          <div className="stat" key={i}>
            <div className="v">
              {s.v}
              <em>{s.e || ""}</em>
            </div>
            <div className="k">{s.k}</div>
          </div>
        ))}
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
          <span className="sep">▪</span>
        </React.Fragment>
      ))}
    </span>
  );
  return (
    <section
      className="panel marquee"
      data-screen-label="07 Marquee"
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

/* ===== INDEX / NOW ===== */
function IndexNow() {
  const ref = useReveal();
  return (
    <section
      id="index"
      className="panel"
      data-screen-label="08 Index"
      data-section-name="Index / Now"
    >
      <div className="panel-bar">
        <span className="id">01</span>
        <span>index · now</span>
        <span className="grow"></span>
        <span className="tk">$ goblin status</span>
      </div>
      <div className="grid-lines index-grid">
        <div className="idx-left">
          <div className="h">// now</div>
          <div className="now-row">
            <span className="k">Open</span>
            <span className="val">
              taking 3 clients · <em>Q3–Q4 26</em>
            </span>
          </div>
          <div className="now-row">
            <span className="k">Building</span>
            <span className="val">an llms.txt linter</span>
          </div>
          <div className="now-row">
            <span className="k">Crawling</span>
            <span className="val">my own graph + demo targets</span>
          </div>
          <div className="now-row">
            <span className="k">Reading</span>
            <span className="val">Google QRG, again</span>
          </div>
          <div className="now-row">
            <span className="k">Based</span>
            <span className="val">Logan Square, CHI</span>
          </div>
        </div>
        <div className="idx-right reveal" ref={ref}>
          <div className="statement">
            <p className="line-mask">
              <span style={{ "--d": "0s" }}>
                I make sites <em>legible</em>
              </span>
            </p>
            <p className="line-mask">
              <span style={{ "--d": ".07s" }}>to crawlers and LLMs —</span>
            </p>
            <p className="line-mask">
              <span style={{ "--d": ".14s" }}>
                so you show up <em>where</em>
              </span>
            </p>
            <p className="line-mask">
              <span style={{ "--d": ".21s" }}>the answer gets written.</span>
            </p>
          </div>
          <div className="body">
            Two years deep in technical SEO and the new world of answer engines.
            I ship <em>schema</em>, fix <em>crawl paths</em>, write the{" "}
            <em>llms.txt</em>, and harden Core Web Vitals — small, urgent jobs
            that a big agency would scope into a quarter. I move in days and
            leave you a test suite.
          </div>
        </div>
      </div>
    </section>
  );
}

/* Work / case-study section ($ ls ./case_study) + its WORK data removed per owner request (2026-06-02). */

/* ===== SERVICES ===== */
const SVCS = [
  {
    num: "(i)",
    title: "Technical SEO",
    lead: "The plumbing: crawl paths, indexation, canonicals, robots, sitemaps — fixed so nothing leaks crawl budget.",
    items: ["Crawl audits", "Indexation", "Canonicals", "Robots & sitemaps"],
  },
  {
    num: "(ii)",
    title: "Schema & structured data",
    lead: "JSON-LD so crawlers and models parse who you are without guessing. Table-stakes hygiene — necessary, not magic. The citation levers are brand mentions and Bing rank; this clears the way for them.",
    items: ["JSON-LD", "Entity markup", "FAQ / HowTo", "Rich results"],
  },
  {
    num: "(iii)",
    title: "AI / answer-engine SEO",
    lead: "Get surfaced inside ChatGPT, Perplexity, and AI Overviews — by earning the brand mentions and Bing-rank signals that drive citations, plus the llms.txt/AEO hygiene that lets them through.",
    items: ["llms.txt", "AEO strategy", "Citation tuning", "RAG-readiness"],
  },
  {
    num: "(iv)",
    title: "Core Web Vitals",
    lead: "Make it fast for humans and bots alike. Green vitals, real-device tested.",
    items: [
      "LCP / CLS / INP",
      "Asset budgets",
      "Edge & caching",
      "Lab + field",
    ],
  },
  {
    num: "(v)",
    title: "Content for robots + humans",
    lead: "Pages that read well to a person and parse cleanly for a model. Both audiences, one draft.",
    items: [
      "Info architecture",
      "Heading logic",
      "Internal links",
      "Editorial passes",
    ],
  },
  {
    num: "(vi)",
    title: "Accessibility (WCAG + 508)",
    lead: "Usable by people on assistive tech and legible to crawlers — the same fixes serve both. Automated axe-core audit across real component states (collapsed, open, error) plus a software-engineer pass, since tooling alone catches ~57%. Required for government (Section 508 / ADA Title II); never sold as compliance-by-tool.",
    items: [
      "WCAG 2.1 AA + Section 508",
      "Stateful axe-core audit",
      "Engineer-reviewed remediation",
      "Reviewed fix PRs",
    ],
  },
];

function Services() {
  const [open, setOpen] = useState(0);
  return (
    <section
      id="services"
      className="panel"
      data-screen-label="10 Services"
      data-section-name="Services"
    >
      <div className="panel-bar">
        <span className="id">03</span>
        <span>$ man goblin</span>
        <span className="grow"></span>
        <span className="tk">six services · one goblin</span>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        {SVCS.map((s, i) => (
          <div
            key={s.num}
            className={"svc-row" + (open === i ? " open" : "")}
            onClick={() => setOpen(open === i ? -1 : i)}
            data-cursor-label={open === i ? "close" : "open"}
          >
            <div className="num">{s.num}</div>
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
              <div className="lead">{s.lead}</div>
              <div className="desc">
                <ul>
                  {s.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="tog">+</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===== QUOTES → house rules / principles (no fabricated testimonials) ===== */
const QUOTES = [
  { q: "Nothing auto-deploys. A software engineer reviews every change.", src: "principle · 01" },
  { q: "Flat fee. No credits, no meter, no surprise invoice.", src: "principle · 02" },
  { q: "We ship the fixes — not a PDF you implement yourself.", src: "principle · 03" },
  { q: "Schema is hygiene. We chase the real levers: mentions + Bing.", src: "principle · 04" },
];

function Quotes() {
  return (
    <section
      className="panel"
      data-screen-label="12 Quotes"
      data-section-name="House rules"
    >
      <div className="panel-bar">
        <span className="id">04</span>
        <span>house rules</span>
        <span className="grow"></span>
        <span className="tk">cat ./principles</span>
      </div>
      <div className="grid-lines quotes">
        {QUOTES.map((x, i) => (
          <div className="quote" key={i}>
            <div className="q">{x.q}</div>
            <div className="src">{x.src}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===== SCROLLS ===== */
const SCROLLS = [
  {
    num: "N.01",
    date: "May 2026",
    read: "8 min",
    tag: "essay",
    title: "What <em>llms.txt</em> is, and why your site needs one.",
  },
  {
    num: "N.02",
    date: "Apr 2026",
    read: "5 min",
    tag: "field note",
    title: "Schema is hygiene, not a citation lever — <em>what actually gets you cited</em>.",
  },
  {
    num: "N.03",
    date: "Mar 2026",
    read: "11 min",
    tag: "teardown",
    title: "How a site gets <em>cited</em> by ChatGPT.",
  },
];

function Scrolls() {
  return (
    <section
      id="scrolls"
      className="panel"
      data-screen-label="13 Scrolls"
      data-section-name="Scrolls"
    >
      <div className="panel-bar">
        <span className="id">05</span>
        <span>$ cat ./scrolls/*.md</span>
        <span className="grow"></span>
        <span className="tk">field notes</span>
      </div>
      <div className="grid-lines scrolls">
        {SCROLLS.map((s) => (
          <div key={s.num} className="scard scard-soon" data-cursor-label="soon">
            <div className="meta">
              <span className="num">{s.num}</span>
              <span>
                {s.tag} · {s.date}
              </span>
            </div>
            <h3 dangerouslySetInnerHTML={{ __html: s.title }}></h3>
            <div className="read">field note · soon</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ===== CONTACT / SUMMON — lead intake + payment-ready (config at top of file) ===== */
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
    // If the form backend key isn't set yet, capture locally and show success (demo mode).
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
        "Couldn't reach the server — check your connection and retry, or email hi@promptgoblin.io.",
      );
    }
    setSending(false);
  };

  return (
    <section
      id="contact"
      className="panel"
      data-screen-label="14 Contact"
      data-section-name="Summon"
    >
      <div className="panel-bar">
        <span className="id">06</span>
        <span>$ goblin --summon</span>
        <span className="grow"></span>
        <span className="tk">3 slots · Q3–Q4 2026</span>
      </div>
      <div className="grid-lines contact-grid">
        <div className="contact-main">
          <div className="big">
            <a href="#contact" data-cursor-label="summon">
              Summon<em>.</em>
              <span className="arr">→</span>
            </a>
          </div>
          <div className="avail">
            Drop your domain and what you want to get cited for — I'll run a{" "}
            <em>free visibility scan</em> and send back the gaps. Best for jobs
            measured in <em>days</em>, not quarters.
            <br />
            <em>No card, no sales call.</em> Paid work carries a{" "}
            <em>100% money-back guarantee</em> — full refund if we don't deliver
            or you're not happy within 14 days.
          </div>

          {!sent ? (
            <form className="summon-form" onSubmit={submit}>
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
                  <span className="arr">→</span>
                </button>
                <a
                  className="btn ghost"
                  href={STRIPE_SCOUT_LINK}
                  data-cursor-label="reserve"
                >
                  reserve a Scout audit
                </a>
              </div>
              {err && <div className="sf-err">⚠ {err}</div>}
            </form>
          ) : (
            <div className="sf-ok">
              <div className="sf-ok-mark">✓</div>
              <div>
                <div className="sf-ok-t">
                  summon received — invisibility cloak: BREAKING
                </div>
                <div className="sf-ok-d">
                  A real software engineer replies within a working day with your
                  free scan. Check your inbox (and spam — goblins lurk there
                  too).
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
              <span className="soon-link">github</span> ·{" "}
              <span className="soon-link">x.com</span> ·{" "}
              <span className="soon-link">substack</span>
            </span>
          </div>
          <div className="cside-row">
            <span className="k">$ pwd</span>
            <span className="v">Chicago, IL · by appt</span>
          </div>
        </div>
      </div>
      <div className="colophon">
        <span>© Prompt_Goblin™ 2024–2026 · Visible AF</span>
        <span>Set in Press Start 2P · VT323 · JetBrains Mono</span>
      </div>
    </section>
  );
}

/* ===== HOW IT WORKS — self-healing eval-gate motion diagram ===== */
const RM = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const ENGINE_PHASES = [
  { stage: 0, gate: null,    pk: "fix packet · a11y", pkFail: false, rd: "scan → gap found: contrast on .cta (sample)", tick: "ok" },
  { stage: 1, gate: "eval",  pk: "→ eval gate",       pkFail: false, rd: "eval gate · running 201 tests + eval…", tick: "ok" },
  { stage: 1, gate: "fail",  pk: "RED · regression",  pkFail: true,  rd: "eval: RED — patch broke 2 tests. bounce back.", tick: "bad" },
  { stage: 0, gate: null,    pk: "self-heal · re-patch", pkFail: false, rd: "self-heal loop · retrieval re-tries the fix", tick: "ok" },
  { stage: 1, gate: "eval",  pk: "→ eval gate",       pkFail: false, rd: "eval gate · re-running…", tick: "ok" },
  { stage: 1, gate: "pass",  pk: "PASS",              pkFail: false, rd: "eval: PASS · 201 tests + eval green (2026-06-02)", tick: "ok" },
  { stage: 2, gate: "pass",  pk: "→ engineer review", pkFail: false, rd: "halt · awaiting engineer approval — nothing auto-ships", tick: "ok" },
  { stage: 2, gate: "pass",  pk: "approved ✓",        pkFail: false, rd: "engineer approved → reviewed PR opened on your repo", tick: "ok" },
  { stage: 2, gate: "pass",  pk: "re-scan → Δ",       pkFail: false, rd: "re-run on cadence · measured before/after delta (sample)", tick: "ok" },
];

function EngineDiagram() {
  const [p, setP] = useState(0);
  const wrapRef = useRef(null);
  const stageRef0 = useRef(null);
  const stageRef1 = useRef(null);
  const stageRef2 = useRef(null);
  const stageRefs = [stageRef0, stageRef1, stageRef2];
  const packetRef = useRef(null);
  const reduced = RM();

  useEffect(() => {
    if (reduced) { setP(6); return; }
    let alive = true;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let i = 0;
      const tick = () => {
        if (!alive) return;
        setP(i % ENGINE_PHASES.length);
        i++;
        timer = setTimeout(tick, i % ENGINE_PHASES.length === 0 ? 1700 : 1500);
      };
      let timer = setTimeout(tick, 600);
      io.disconnect();
      cleanup = () => { alive = false; clearTimeout(timer); };
    }, { threshold: 0.35 });
    let cleanup = () => { alive = false; };
    if (wrapRef.current) io.observe(wrapRef.current);
    return () => { io.disconnect(); cleanup(); };
  }, [reduced]);

  const place = useCallback(() => {
    const wrap = wrapRef.current, pk = packetRef.current;
    if (!wrap || !pk) return;
    const target = stageRefs[ENGINE_PHASES[p].stage].current;
    if (!target) return;
    const w = wrap.getBoundingClientRect(), t = target.getBoundingClientRect();
    const x = t.left - w.left + t.width / 2 - pk.offsetWidth / 2;
    const y = t.top - w.top - pk.offsetHeight - 6;
    pk.style.transform = `translate(${Math.max(2, x)}px, ${Math.max(2, y)}px)`;
  }, [p]);

  useEffect(() => { place(); }, [p, place]);
  useEffect(() => {
    const r = () => place();
    window.addEventListener("resize", r);
    const t = setTimeout(place, 120);
    return () => { window.removeEventListener("resize", r); clearTimeout(t); };
  }, [place]);

  const ph = ENGINE_PHASES[p];
  const ENGINE_STAGES = [
    { num: "01 · diagnose", name: "Find the gap", desc: "RAG pipeline samples engines + audits SEO / a11y, surfaces a scoped fix." },
    { num: "02 · eval gate", name: "Prove it passes", desc: "CI/CD eval gate runs the suite. Red on regression → the fix bounces back to self-heal." },
    { num: "03 · engineer", name: "An engineer approves", desc: "Every change halts here. A software engineer approves → reviewed PR. Nothing auto-deploys." },
  ];

  return (
    <div className="panel engine" ref={wrapRef}>
      <div className="panel-bar engine-panel-bar">
        <span className="lhs"><span className="lights"><i className="on"></i><i className="on"></i><i></i></span>goblin-engine · self-healing · eval-gated</span>
        <span className="sample-tag">sample run</span>
      </div>

      <div className="engine-stage-wrap">
        <div className="stages">
          {ENGINE_STAGES.map((s, i) => {
            const isGate = i === 1;
            const active = ph.stage === i;
            const gateState = isGate ? ph.gate : null;
            return (
              <React.Fragment key={i}>
                <div ref={stageRefs[i]}
                  className={"stage" + (isGate ? " gate" : "") + (active ? " active" : "") + (gateState === "fail" ? " fail" : "")}>
                  <div className="stage-num">{s.num}</div>
                  <div className="stage-name">{s.name}</div>
                  <div className="stage-desc">{s.desc}</div>
                  {isGate && gateState === "pass" && <span className="stage-badge pass">● eval PASS</span>}
                  {isGate && gateState === "fail" && <span className="stage-badge failb">● eval RED</span>}
                  {isGate && (gateState === "eval" || gateState === null) && <span className="stage-badge">○ idle</span>}
                  {i === 2 && (
                    <span className="stage-badge">
                      <svg className="lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                      engineer-gated
                    </span>
                  )}
                </div>
                {i < 2 && <div className="conn"><svg className="h" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h15M14 7l5 5-5 5"/></svg><svg className="v" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v15M7 14l5 5 5-5"/></svg></div>}
              </React.Fragment>
            );
          })}
        </div>
        {!reduced && (
          <div ref={packetRef} className={"packet" + (ph.pkFail ? " fail" : "")}>
            <span className="pk-dot"></span>{ph.pk}
          </div>
        )}
      </div>

      <div className="engine-readout">
        <span className={"rd-tick" + (ph.tick === "bad" ? " bad" : "")}>{ph.tick === "bad" ? "⚠" : "▸"}</span>
        <span>{ph.rd}</span>
      </div>
      <div className="engine-legend">
        <span><i className="lg-active"></i>active path</span>
        <span><i className="lg-fail"></i>failed gate → self-heal</span>
        <span><i className="lg-human"></i>engineer review gate</span>
      </div>
      <p className="engine-rm-note">▸ One pipeline: <b style={{ color: "var(--lime)" }}>diagnose → eval gate → engineer approve</b>. A failed gate bounces the fix back to the self-healing loop; nothing ships until a software engineer approves. SEO + accessibility proven on the gate (2026-06-02); schema scaffolded.</p>
    </div>
  );
}

function HowItWorks() {
  const ref = useReveal();
  return (
    <section
      id="how-it-works"
      className="panel"
      data-screen-label="03 HowItWorks"
      data-section-name="How we move the needle"
    >
      <div className="panel-bar">
        <span className="id">▸</span>
        <span>$ goblin engine --explain</span>
        <span className="grow"></span>
        <span className="tk">self-healing · eval-gated · engineer-approved</span>
      </div>
      <div className="grid-lines how-grid">
        <div className="how-intro reveal" ref={ref}>
          <span className="kicker">how it works · the engine under the hood</span>
          <h2 className="h-sec">How we actually move the needle</h2>
          <p className="mono-note" style={{ marginTop: 8, marginBottom: 18 }}>// automated system · software-engineer judgment · measurable results</p>
          <p className="how-p">Most SEO shops send you a PDF. <span style={{ color: "var(--lime)" }}>We run a system.</span></p>
          <p className="how-p">Under the hood: one automated pipeline that finds gaps across answer-engine visibility, technical SEO, and accessibility — with bounded self-healing loops and an eval gate that proves a fix actually works before any engineer sees it. Then a software engineer reviews every recommended change. Then it ships to your repo or CMS. Then the system re-runs on a schedule and measures the delta.</p>
          <p className="how-punch">You see the gap. Then you watch it close.</p>
          <p className="how-tech">"RAG pipeline" and "CI/CD eval gate" are the accurate technical names for what runs. We surface them once for credibility, then translate them for everyone else.</p>
        </div>
        <div className="how-diagram">
          <EngineDiagram />
        </div>
      </div>
      <p className="how-close">The technical name for the system is a <b>self-healing RAG pipeline on a CI/CD eval gate</b>. The plain-language version: an automated system finds the gaps, proves fixes work, a software engineer ships them, and you watch the numbers move.</p>
    </section>
  );
}

/* ===== LIVE SCAN — goblin@visibility-mesh terminal (ported from handoff, dark+lime) ===== */
let __scanUid = 0; /* monotonic key source — unique across re-runs of the scan loop */
const mkLine = (o) => ({ ...o, id: __scanUid++ });
const scanSleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The real operations Tier-1 performs, narrated as honest phases. Each resolves
// to a MEASURED value from the report below — Tier-1 never queries answer engines,
// so this path never claims a ChatGPT/Claude/Gemini citation count.
const SCAN_PHASES = [
  { key: "fetch", label: "fetch surface" },
  { key: "robots", label: "read robots.txt" },
  { key: "llms", label: "read llms.txt" },
  { key: "schema", label: "parse JSON-LD" },
  { key: "score", label: "score hygiene" },
];

// Idle loop: a clearly-labelled SAMPLE of what the FREE hygiene scan measures.
// Illustrative only — no real domain queried, no fabricated engine/citation stats.
const SAMPLE_LINES = [
  { t: "cmd", text: "goblin scan --surface hygiene --sample" },
  { t: "info", text: "illustrative sample · no domain queried" },
  { t: "phase", k: "fetch surface", v: "71 KB", tone: "ok" },
  { t: "phase", k: "read robots.txt", v: "welcomes AI crawlers", tone: "ok" },
  { t: "phase", k: "read llms.txt", v: "not found", tone: "warn" },
  { t: "phase", k: "parse JSON-LD", v: "2 of 5 entity types", tone: "warn" },
  { t: "phase", k: "score hygiene", v: "64 / 100", tone: "warn" },
  { t: "sep" },
  { t: "issue", sev: "HIGH", text: "missing FAQPage + Product JSON-LD" },
  { t: "issue", sev: "MED", text: "no llms.txt — hygiene, not a citation lever" },
  { t: "issue", sev: "LOW", text: "2 <h1> tags — pick one" },
  { t: "sep" },
  { t: "ok", text: "goblin.recommend → structured data + crawl welcome mat" },
  { t: "sample", text: "↑ illustrative sample — not your site · enter your domain above for a real scan" },
];

function scanHost(url) {
  return String(url || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

// Resolve each phase to a MEASURED value pulled straight from the real report.
function phaseValues(r) {
  r = r || {};
  const cwv = r.coreWebVitalsProxies || {};
  const crawl = r.crawlability || {};
  const llms = r.llmsTxt || {};
  const schema = r.schema || {};
  const foundN = (schema.found || []).length;
  const total = foundN + (schema.missing || []).length;
  return {
    fetch: cwv.htmlKilobytes != null ? cwv.htmlKilobytes + " KB" : "ok",
    robots: !crawl.present
      ? "not found"
      : crawl.welcomesAiBots
        ? "welcomes AI crawlers"
        : "blocks AI crawlers",
    llms: llms.present ? (llms.valid ? "found · on-spec" : "found · off-spec") : "not found",
    schema: foundN + (total ? " of " + total : "") + " entity types",
    score: (r.hygieneScore != null ? r.hygieneScore : "?") + " / 100",
  };
}
function phaseTone(r, key) {
  r = r || {};
  if (key === "robots") return r.crawlability && r.crawlability.welcomesAiBots ? "ok" : "warn";
  if (key === "llms") return r.llmsTxt && r.llmsTxt.present ? "ok" : "warn";
  if (key === "schema") return r.schema && (r.schema.missing || []).length === 0 ? "ok" : "warn";
  if (key === "score") {
    const s = r.hygieneScore;
    return s >= 80 ? "ok" : s >= 50 ? "warn" : "bad";
  }
  return "ok";
}
function scoreBand(s) {
  if (s == null) return { key: "warn", label: "scan complete" };
  if (s >= 80) return { key: "ok", label: "healthy" };
  if (s >= 50) return { key: "warn", label: "fixable" };
  return { key: "bad", label: "cursed" };
}

function LiveScan() {
  const [mode, setMode] = useState("idle"); // idle | scanning | results | error
  const [lines, setLines] = useState([]);
  const [pct, setPct] = useState(0);
  const [scanLabel, setScanLabel] = useState("");
  const [steps, setSteps] = useState([]); // visual stepper: per-phase status + measured value
  const [report, setReport] = useState(null);
  const [summary, setSummary] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState("");
  const runRef = useRef(0);
  const bodyRef = useRef(null);

  // Idle: loop the SAMPLE reveal. A run token (runRef) cancels it the instant a
  // real scan starts and makes the loop immune to StrictMode double-invoke, so
  // terminal lines never double up.
  useEffect(() => {
    if (mode !== "idle") return;
    const run = ++runRef.current;
    let i = 0;
    let timer;
    setLines([]);
    setPct(0);
    const tick = () => {
      if (runRef.current !== run) return;
      if (i >= SAMPLE_LINES.length) {
        timer = setTimeout(() => {
          if (runRef.current !== run) return;
          setLines([]);
          setPct(0);
          i = 0;
          timer = setTimeout(tick, 900);
        }, 4200);
        return;
      }
      setLines((p) => [...p, mkLine(SAMPLE_LINES[i])]);
      setPct(Math.round(((i + 1) / SAMPLE_LINES.length) * 100));
      i++;
      timer = setTimeout(tick, 300 + Math.random() * 220);
    };
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [mode]);

  const resetToIdle = () => {
    runRef.current++;
    setReport(null);
    setSummary("");
    setErrorMsg("");
    setTarget("");
    setMode("idle");
  };

  const onScan = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    if (data.botcheck) return; // honeypot
    const domain = (data.domain || "").trim();
    const competitor = (data.competitor || "").trim();
    const host = scanHost(domain);
    const scanId =
      "scan_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    data.scan_id = scanId;
    captureLead("free_scan_requested", {
      domain,
      email: data.email,
      competitor,
      scan_id: scanId,
    });
    setEmail(data.email || "");
    setTarget(host);

    const run = ++runRef.current;
    const alive = () => runRef.current === run;
    setMode("scanning");
    setReport(null);
    setErrorMsg("");
    setSummary("");
    setLines([mkLine({ t: "cmd", text: "goblin scan --surface hygiene --domain " + host })]);
    setPct(8);
    setSteps(SCAN_PHASES.map((p) => ({ key: p.key, label: p.label, status: "pending", value: null, tone: "ok" })));

    // Fire the REAL Tier-1 request immediately, then narrate the genuine
    // operations (labels only — values come from the real report) while it runs.
    const respPromise = runHygieneScan(domain);
    for (let idx = 0; idx < SCAN_PHASES.length; idx++) {
      if (!alive()) return;
      setScanLabel(SCAN_PHASES[idx].label);
      setSteps((prev) => prev.map((s, i) => (i <= idx ? { ...s, status: "active" } : s)));
      setPct(Math.min(78, 12 + (idx + 1) * 13));
      await scanSleep(420 + Math.random() * 160);
    }
    if (!alive()) return;
    setScanLabel("compiling report");

    let resp;
    try {
      resp = await respPromise;
    } catch (_) {
      resp = null;
    }
    if (!alive()) return;

    // Honest failure path — a real submit NEVER falls back to demo theater.
    if (!resp || !resp.ok || !resp.report) {
      const why = (resp && resp.error) || "host unreachable or not public";
      setLines((p) => [...p, mkLine({ t: "err", text: "scan failed · " + why })]);
      setErrorMsg(why);
      setScanLabel("");
      setPct(100);
      setMode("error");
      captureEvent("scan_failed", { scan_id: scanId, domain, reason: "tier1_unreachable" });
      return;
    }

    // Real result — the "aha" moment. Reveal MEASURED phase values one by one.
    const r = resp.report;
    const pv = phaseValues(r);
    setScanLabel("");
    try {
      window.posthog &&
        window.posthog.capture("scan_result_shown", {
          scan_id: scanId,
          domain,
          hygiene_score: r.hygieneScore,
          findings: (r.findings || []).length,
        });
    } catch (_) {}

    for (let j = 0; j < SCAN_PHASES.length; j++) {
      const p = SCAN_PHASES[j];
      if (!alive()) return;
      await scanSleep(240 + Math.random() * 120);
      if (!alive()) return;
      const tone = phaseTone(r, p.key);
      setLines((prev) => [
        ...prev,
        mkLine({ t: "phase", k: p.label, v: pv[p.key], tone }),
      ]);
      setSteps((prev) =>
        prev.map((s, i) => (i === j ? { ...s, status: "done", value: pv[p.key], tone } : s)),
      );
      setPct((prev) => Math.min(94, prev + 4));
    }
    if (!alive()) return;
    setLines((prev) => [...prev, mkLine({ t: "sep" })]);
    const findings = (r.findings || []).slice(0, 6);
    for (const f of findings) {
      if (!alive()) return;
      await scanSleep(200 + Math.random() * 120);
      if (!alive()) return;
      setLines((prev) => [
        ...prev,
        mkLine({
          t: "issue",
          sev: f.severity >= 4 ? "HIGH" : f.severity === 3 ? "MED" : "LOW",
          text: f.detail || "",
        }),
      ]);
    }
    if (!findings.length) {
      setLines((prev) => [
        ...prev,
        mkLine({ t: "ok", text: "no hygiene gaps found — clean surface" }),
      ]);
    }
    if (!alive()) return;
    await scanSleep(220);
    setLines((prev) => [
      ...prev,
      mkLine({ t: "sep" }),
      mkLine({ t: "ok", text: resp.summary || "scan complete" }),
    ]);
    setReport(r);
    setSummary(resp.summary || "");
    setPct(100);
    setMode("results");

    // Email-gated Tier-2 citation teaser (honest no-op until a key is set).
    if (!competitor) {
      captureEvent("tier2_skipped_no_competitor", { scan_id: scanId, domain });
    } else {
      runCitationTeaser({ email: data.email, domain, competitor }).then((tier2) => {
        if (!tier2) {
          captureEvent("tier2_error", {
            scan_id: scanId,
            domain,
            competitor,
            reason: "network_or_unreachable",
          });
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
            client_cited_count: results.filter((r2) => r2.clientCited).length,
            competitor_cited_count: results.filter((r2) => r2.competitorCited).length,
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
  }, [lines.length, mode]);

  const band = report ? scoreBand(report.hygieneScore) : null;
  const statusPill =
    mode === "results" && band
      ? band.key
      : mode === "scanning"
        ? "scanning"
        : mode === "error"
          ? "bad"
          : "cursed";
  const statusText =
    mode === "results" && band
      ? (band.key === "ok" ? "✓ " : band.key === "warn" ? "⚡ " : "✕ ") + band.label
      : mode === "scanning"
        ? "… scanning"
        : mode === "error"
          ? "✕ failed"
          : "✕ cursed";

  return (
    <section
      id="scan"
      className="panel"
      data-screen-label="05 Scan"
      data-section-name="Live Scan"
    >
      <div className="panel-bar">
        <span className="id">▸</span>
        <span>$ goblin scan --surface hygiene</span>
        <span className="grow"></span>
        <span className="tk">
          {mode === "results"
            ? "live · real result"
            : mode === "scanning"
              ? "live · scanning your domain"
              : mode === "error"
                ? "scan failed"
                : "sample · enter your domain for a real scan"}
        </span>
      </div>
      <div className="grid-lines scan-grid">
        <div className="scan-term">
          <div className="win-bar">
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
            <span className="grow">goblin@visibility-mesh — /scan</span>
            <span>{String(pct).padStart(3, "0")}%</span>
          </div>
          <div className="scan-progress" aria-hidden="true">
            <i style={{ width: pct + "%" }} />
          </div>
          <div className="scan-body" ref={bodyRef}>
            {lines.map((l) => (
              <div className="scan-ln" key={l.id}>
                {l.t === "cmd" && (
                  <>
                    <span className="pfx">$</span> {l.text}
                  </>
                )}
                {l.t === "info" && (
                  <>
                    <span className="pfx">›</span>{" "}
                    <span className="mu">{l.text}</span>
                  </>
                )}
                {l.t === "kv" && (
                  <>
                    <span className="pfx">›</span>{" "}
                    <span className="key">{l.k}:</span>{" "}
                    <span className="mu">{l.v}</span>
                  </>
                )}
                {l.t === "phase" && (
                  <>
                    <span className="pfx">›</span>{" "}
                    <span className="key">{l.k}</span>
                    <span className="ph-dots"> ··· </span>
                    <span className={"pv pv-" + (l.tone || "ok")}>{l.v}</span>
                  </>
                )}
                {l.t === "warn" && (
                  <>
                    <span className="warn">▲</span>{" "}
                    <span className="warn">{l.text}</span>
                  </>
                )}
                {l.t === "err" && (
                  <>
                    <span className="err">✕</span>{" "}
                    <span className="err">{l.text}</span>
                  </>
                )}
                {l.t === "issue" && (
                  <>
                    <span className={l.sev === "HIGH" ? "err" : "mu"}>
                      {l.sev === "HIGH" ? "▲" : "·"}
                    </span>{" "}
                    <span className="sev">[{l.sev}]</span>{" "}
                    <span className="mu">{l.text}</span>
                  </>
                )}
                {l.t === "ok" && (
                  <>
                    <span className="ok">✓</span>{" "}
                    <span className="ok">{l.text}</span>
                  </>
                )}
                {l.t === "sample" && (
                  <span className="scan-sample-tag">{l.text}</span>
                )}
                {l.t === "sep" && (
                  <span className="mu sep">
                    ────────────────────────────────
                  </span>
                )}
              </div>
            ))}
            {mode === "scanning" ? (
              <div className="scan-ln scan-running">
                <span className="pfx">›</span>{" "}
                <span className="mu">{scanLabel || "scanning"}</span>{" "}
                <span className="scan-cur" />
              </div>
            ) : (
              <div className="scan-ln">
                <span className="pfx">$</span> <span className="scan-cur" />
              </div>
            )}
          </div>
        </div>
        <div className="scan-side">
          {mode === "results" && report ? (
            <ScanResult
              report={report}
              email={email}
              target={target}
              band={band}
              steps={steps}
              onReset={resetToIdle}
            />
          ) : mode === "error" ? (
            <div className="scan-err-card">
              <div className="sf-lbl">$ scan failed</div>
              <div className="scan-err-msg">
                Couldn't complete a real scan of <b>{target}</b>.
              </div>
              <div className="scan-err-why">{errorMsg}</div>
              <button className="btn" onClick={resetToIdle} data-cursor-label="retry">
                try another domain <span className="arr">→</span>
              </button>
            </div>
          ) : mode === "scanning" ? (
            <div className="scan-live">
              <div className="sf-lbl">$ scanning {target}</div>
              <ScanStepper steps={steps} />
            </div>
          ) : (
            <form className="scan-form" onSubmit={onScan}>
              <div className="sf-lbl">$ run a free scan</div>
              <input
                name="domain"
                required
                placeholder="yourbrand.com"
                autoComplete="url"
                disabled={mode === "scanning"}
              />
              <input
                name="email"
                type="email"
                required
                placeholder="you@brand.com"
                autoComplete="email"
                disabled={mode === "scanning"}
              />
              <input
                name="competitor"
                placeholder="a competitor (optional)"
                autoComplete="off"
                disabled={mode === "scanning"}
              />
              <input
                type="text"
                name="botcheck"
                className="sf-hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
              <button
                className="btn"
                type="submit"
                data-cursor-label="scan"
                disabled={mode === "scanning"}
              >
                {mode === "scanning" ? "scanning…" : "run my free scan"}{" "}
                <span className="arr">→</span>
              </button>
              <div className="scan-disclaimer">
                Live, real result: a technical-<b>hygiene</b> scan of your live
                page — structured data, crawl welcome mat, head tags & Core Web
                Vitals proxies. Hygiene is table stakes, <b>not</b> a citation
                guarantee. The full multi-engine citation audit (ChatGPT · Claude
                · Gemini · Perplexity · AI Overviews) plus SEO &amp; accessibility
                ships with a paid Scout audit.
              </div>
              <ul className="scan-checks">
                <li>structured data / JSON-LD entities</li>
                <li>robots.txt + llms.txt crawl welcome mat</li>
                <li>title · meta · canonical · OpenGraph</li>
                <li>Core Web Vitals proxies</li>
              </ul>
            </form>
          )}
          <div className="scan-status-row">
            <span className="k">visibility status</span>
            <span className={"scan-pill " + statusPill}>{statusText}</span>
          </div>
          <div className="scan-id">
            scan id · GBL-{(pct * 73 + 1031).toString(16).toUpperCase()}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScanStepper({ steps }) {
  return (
    <ol className="scan-stepper" aria-label="scan progress">
      {steps.map((s) => (
        <li className={"sx " + s.status} key={s.key}>
          <span className="sx-dot" aria-hidden="true">
            {s.status === "done" ? "✓" : ""}
          </span>
          <span className="sx-label">{s.label}</span>
          {s.value ? (
            <span className={"sx-val pv-" + (s.tone || "ok")}>{s.value}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function ScanResult({ report, email, target, band, steps, onReset }) {
  const found = (report.schema && report.schema.found) || [];
  const missing = (report.schema && report.schema.missing) || [];
  const findings = report.findings || [];
  const highN = findings.filter((f) => f.severity >= 4).length;
  const medN = findings.filter((f) => f.severity === 3).length;
  const lowN = findings.filter((f) => f.severity <= 2).length;
  return (
    <div className="scan-result">
      {steps && steps.length ? <ScanStepper steps={steps} /> : null}
      <div className="sr-top">
        <div className={"sr-score band-" + band.key}>
          <span className="sr-num">{report.hygieneScore}</span>
          <span className="sr-den">/100</span>
        </div>
        <div className="sr-top-meta">
          <div className="sr-k">hygiene · {target}</div>
          <div className="sr-sub">
            {highN} high · {medN} medium · {lowN} low
          </div>
        </div>
      </div>
      <div className="sr-block">
        <div className="sr-k">structured data</div>
        <div className="sr-chips">
          {found.map((t) => (
            <span className="sr-chip ok" key={"f" + t}>
              ✓ {t}
            </span>
          ))}
          {missing.map((t) => (
            <span className="sr-chip miss" key={"m" + t}>
              ✕ {t}
            </span>
          ))}
          {!found.length && !missing.length && <span className="sr-chip">—</span>}
        </div>
      </div>
      <p className="sr-disc">{report.disclaimer}</p>
      <div className="sr-cta">
        <div className="sr-ok-t">
          ✓ Real hygiene result delivered above. A software engineer (me) will
          personally review it and email {email || "you"} about the full citation
          &amp; accessibility audit — no automated report.
        </div>
        <a className="btn" href="#pricing" data-cursor-label="audit">
          see the full Scout audit <span className="arr">→</span>
        </a>
      </div>
      <button className="sr-again" onClick={onReset} data-cursor-label="rescan">
        ↺ scan another domain
      </button>
    </div>
  );
}

/* ===== VISIBILITY MESH — agentic graph (ported from handoff, dark+lime) ===== */
const MESH_NODES = [
  { id: "intent", x: 2, y: 16, t: "user.intent", v: '"best fleet software"' },
  { id: "llm", x: 30, y: 4, t: "llm.query.expand", v: "GPT · Claude · Gemini · Pplx · AIO" },
  { id: "rag", x: 28, y: 56, t: "rag.retrieve", v: "k=24 sources" },
  { id: "cite", x: 54, y: 34, t: "citation.weave", v: "you vs. 6 competitors" },
  { id: "schema", x: 52, y: 74, t: "audit.schema·seo·a11y", v: "12 gaps · 4 a11y" },
  { id: "fix", x: 72, y: 16, t: "goblin.recommend", v: "12 ranked fixes" },
  { id: "ship", x: 72, y: 62, t: "engineer.review → PR", v: "queued · 3 pending" },
];
const MESH_EDGES = [
  ["intent", "llm"],
  ["intent", "rag"],
  ["llm", "cite"],
  ["rag", "cite"],
  ["rag", "schema"],
  ["cite", "fix"],
  ["schema", "fix"],
  ["fix", "ship"],
];
const MESH_STEPS = [
  [
    "01",
    "Listen to prompt surfaces",
    "Agents sample real buyer queries across ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews — not just keyword tools.",
  ],
  [
    "02",
    "Retrieve & diff citation graph",
    "Map who LLMs actually cite for your category, then diff against your domain to expose exactly which sources you're losing to.",
  ],
  [
    "03",
    "Audit: schema · SEO · accessibility",
    "One pass flags missing entities & structured data, technical-SEO leaks, thin content, AND WCAG 2.1 AA / Section 508 gaps — across real rendered component states, not a single snapshot.",
  ],
  [
    "04",
    "Goblin recommendation engine",
    "Each gap becomes a ranked, scoped task with impact, effort, and a paste-ready fix prompt a coding agent can act on.",
  ],
  [
    "05",
    "Engineer-reviewed PRs",
    "A software engineer approves every change before it hits your CMS, schema, or repo. Agentic, but accountable — nothing auto-ships.",
  ],
  [
    "06",
    "Loop on cadence — automatically",
    "The graph re-runs on a schedule and reports the measured before/after delta. Visibility, citations, SEO, and a11y coverage become a tracked KPI, not a vibe.",
  ],
];

function VisibilityMesh() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setActive((i) => (i + 1) % MESH_NODES.length),
      1100,
    );
    return () => clearInterval(id);
  }, []);
  const activeId = MESH_NODES[active].id;
  const activeEdge = MESH_EDGES[active % MESH_EDGES.length];
  const VB_W = 900,
    VB_H = 480;
  const pos = (id) => {
    const n = MESH_NODES.find((x) => x.id === id);
    return { x: (n.x / 100) * VB_W + 92, y: (n.y / 100) * VB_H + 30 };
  };

  return (
    <section
      id="mesh"
      className="panel"
      data-screen-label="04 Mesh"
      data-section-name="Visibility Mesh"
    >
      <div className="panel-bar">
        <span className="id">▸</span>
        <span>$ goblin graph --run</span>
        <span className="grow"></span>
        <span className="tk">langgraph workflow · engineer-gated · sample run</span>
      </div>
      <div className="grid-lines mesh-grid">
        <div className="mesh-stage">
          <div className="mesh-bg" />
          <div className="mesh-head">
            <span className="mh-l">goblin-graph.runtime</span>
            <span className="mh-r">
              ⚡ executing · {String(active + 1).padStart(2, "0")} /{" "}
              {String(MESH_NODES.length).padStart(2, "0")}
            </span>
          </div>
          <div className="mesh-svg">
            <svg
              width="100%"
              height="100%"
              viewBox={`0 0 ${VB_W + 200} ${VB_H + 60}`}
              preserveAspectRatio="none"
            >
              {MESH_EDGES.map(([a, b], i) => {
                const A = pos(a),
                  B = pos(b);
                const on = activeEdge[0] === a && activeEdge[1] === b;
                return (
                  <g key={i}>
                    <line
                      x1={A.x}
                      y1={A.y}
                      x2={B.x}
                      y2={B.y}
                      stroke={on ? "var(--lime)" : "var(--line-2)"}
                      strokeWidth={on ? 2 : 1}
                      strokeDasharray={on ? "0" : "4 5"}
                    />
                    {on && (
                      <circle r="4" fill="var(--lime)">
                        <animateMotion
                          dur="1.1s"
                          repeatCount="indefinite"
                          path={`M${A.x},${A.y} L${B.x},${B.y}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
            {MESH_NODES.map((n) => (
              <div
                key={n.id}
                className={"mnode" + (activeId === n.id ? " on" : "")}
                style={{ left: n.x + "%", top: n.y + "%" }}
              >
                <span className="pin" />
                <div className="t">{n.t}</div>
                <div className="v">{n.v}</div>
              </div>
            ))}
          </div>
          <div className="mesh-legend">
            <span>
              <i className="lg-on" /> active path
            </span>
            <span>
              <i className="lg-idle" /> idle edge
            </span>
            <span>
              <i className="lg-gate" /> engineer review gate
            </span>
          </div>
        </div>
        <ol className="mesh-steps">
          {MESH_STEPS.map(([num, t, d]) => (
            <li key={num}>
              <div className="sn">{num}</div>
              <div>
                <div className="st">{t}</div>
                <div className="sd">{d}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ===== PRICING — Scout / Warband / Warlord (Stripe Payment Links) ===== */
const TIERS = [
  {
    key: "scout",
    name: "Goblin Scout",
    who: "founders & solo operators",
    price: "2,950",
    interval: "one-time",
    link: STRIPE_LINKS.scout,
    cta: "Hire a Scout",
    desc: "A 5-surface visibility audit that ships reviewed fixes — not a PDF. Headlined by your citation-graph diff vs a named competitor.",
    bullets: [
      "Full LLM citation audit · 5 surfaces",
      "Schema + entity gap report",
      "Competitor citation diff (top 6)",
      "Ranked fix queue · scored by impact × effort",
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
    desc: "The recurring agentic loop. We run the graph and ship the reviewed PRs — you approve.",
    bullets: [
      "Everything in Scout",
      "Weekly agentic re-runs",
      "Citation-acquisition campaigns",
      "Schema + content PRs to your repo / CMS",
      "Slack w/ a real goblin · <24h SLA",
      "Live visibility dashboard",
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
    desc: "White-label the goblin. Multi-domain, custom graph, dedicated strategist.",
    bullets: [
      "Everything in Warband",
      "Up to 8 domains / brands",
      "Custom LangGraph workflows",
      "Dedicated retrieval mesh",
      "Quarterly strategy summit",
      "White-label deliverables",
    ],
  },
];

function Pricing() {
  const click = (t) => {
    // Rich checkout-intent event so PostHog can build a revenue-weighted funnel
    // (free_scan -> scan_result_shown -> summon -> checkout_clicked -> $).
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
      data-screen-label="11 Pricing"
      data-section-name="Pricing"
    >
      <div className="panel-bar">
        <span className="id">07</span>
        <span>$ goblin --pricing</span>
        <span className="grow"></span>
        <span className="tk">flat fee · no credits · no sales call</span>
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
                  <span className="c">▸</span> {b}
                </li>
              ))}
            </ul>
            <a
              className={"btn" + (t.featured ? "" : " ghost")}
              href={t.link}
              data-cursor-label="checkout"
              onClick={() => click(t)}
            >
              {t.cta} <span className="arr">→</span>
            </a>
          </div>
        ))}
      </div>
      <div className="penterprise">
        <span>
          <b style={{ color: "var(--lime)" }}>✓ 100% money-back guarantee</b>{" "}
          — on the work, not the algorithm. If we don't deliver your audit, or
          you're not happy with it within 14 days, you get every dollar back. We
          won't promise a citation number (nobody honestly can) — we guarantee
          the work and measure the rest straight.
        </span>
      </div>
      <div className="penterprise">
        <span>
          ◆ enterprise · multi-region · regulated — on-prem retrieval, custom
          auth, a goblin embedded in your team.
        </span>
        <a
          className="btn ghost"
          href="mailto:hi@promptgoblin.io"
          data-cursor-label="talk"
        >
          talk to a goblin <span className="arr">→</span>
        </a>
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
  { id: "01 Hero", name: "Hero" },
  { id: "02 Spellbook", name: "Spellbook" },
  { id: "03 HowItWorks", name: "How we move the needle" },
  { id: "04 Mesh", name: "Visibility Mesh" },
  { id: "05 Scan", name: "Live Scan" },
  { id: "06 Stats", name: "Telemetry" },
  { id: "07 Marquee", name: "Keywords" },
  { id: "08 Index", name: "Index / Now" },
  { id: "10 Services", name: "./services" },
  { id: "11 Pricing", name: "Pricing" },
  { id: "12 Quotes", name: "Word on street" },
  { id: "13 Scrolls", name: "./scrolls" },
  { id: "14 Contact", name: "Summon" },
];

function App() {
  const ids = SECTIONS.map((s) => s.id);
  const active = useSectionSpy(ids);
  const [theme, setTheme] = useTheme();
  return (
    <>
      <Loader />
      <Cursor />
      <div className="grain"></div>
      <HUDTop theme={theme} setTheme={setTheme} />
      <main>
        <div className="os">
          <Hero />
          <Spellbook />
          <HowItWorks />
          <VisibilityMesh />
          <LiveScan />
          <Stats />
          <Marquee />
          <IndexNow />
          <Services />
          <Pricing />
          <Quotes />
          <Scrolls />
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
