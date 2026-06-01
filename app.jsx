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

// Fire-and-forget lead capture: PostHog event + Web3Forms (no-op until the key is set).
function captureLead(event, data) {
  try {
    window.posthog && window.posthog.capture(event, { domain: data.domain });
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
            schema, crawl, and content fixes (human-reviewed, never
            auto-deployed) to close the gap. Days, not quarters.
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
            <span className="sb-bolt">
              <SpriteLightning size={3} />
            </span>{" "}
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
  { v: "100", e: "%", k: "Schema valid · this site" },
  { v: "180", e: "ms", k: "Median TTFB · this site" },
  { v: "7", k: "Pipeline nodes · human-gated" },
  { v: "0", k: "Changes auto-deployed" },
];

function Stats() {
  return (
    <section
      className="panel"
      data-screen-label="05 Stats"
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
      data-screen-label="06 Marquee"
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
      data-screen-label="07 Index"
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
              2 of 3 slots · <em>Q3 26</em>
            </span>
          </div>
          <div className="now-row">
            <span className="k">Building</span>
            <span className="val">an llms.txt linter</span>
          </div>
          <div className="now-row">
            <span className="k">Crawling</span>
            <span className="val">12 client graphs</span>
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

/* ===== WORK =====
   One REAL dogfood case study (live OpenAI + Claude scan of our own site,
   2026-06-01) + honest method cards. No fabricated clients or outcomes. */
const WORK = [
  {
    num: "01",
    nm: "The Goblin's Own Lair",
    tag: "dogfood · live scan",
    span: 2,
    title: "promptgoblin.zatgeist.com",
    em: "— baseline 2026-06-01",
    sub: "We scanned ourselves first. Honest starting line: 0% cited.",
    term: [
      { t: "cmd", v: "goblin scan --domain promptgoblin.zatgeist.com" },
      { t: "mu", v: "// engines: ChatGPT + Claude · 8 buyer queries" },
      { t: "warn", v: "client cited: 0%  (so is the competitor)" },
      { t: "mu", v: "// engines cite semrush, ahrefs, moz, hubspot" },
      { t: "ok", v: "12 fixes queued: 5 schema · 5 citation · 2 content" },
      { t: "ok", v: "re-scan in 2 wks → measured delta, not a promise" },
    ],
    res: "baseline captured · fixes shipping · delta to follow",
  },
  {
    num: "02",
    nm: "Schema layer",
    tag: "method",
    title: "Entity coverage",
    em: "",
    sub: "What an audit surfaces (illustrative, not a client result).",
    term: [
      { t: "cmd", v: "goblin audit --schema" },
      { t: "mu", v: "// parse JSON-LD @types vs expected set" },
      { t: "ok", v: "flag missing FAQPage / Product / Org / WebSite" },
    ],
    res: "hygiene gaps → paste-ready JSON-LD",
  },
  {
    num: "03",
    nm: "Citation diff",
    tag: "method",
    title: "Share of citations",
    em: "",
    sub: "Who the engines cite for your category — vs a named rival.",
    term: [
      { t: "cmd", v: "goblin diff --vs competitor.com" },
      { t: "mu", v: "// ask 8 buyer prompts across 5 surfaces" },
      { t: "ok", v: "rank the sources you're losing to" },
    ],
    res: "the gap, named — not a vanity score",
  },
  {
    num: "04",
    nm: "Content gaps",
    tag: "method",
    title: "Answer coverage",
    em: "",
    sub: "High-intent questions with no page that answers them.",
    term: [
      { t: "cmd", v: "goblin audit --content" },
      { t: "mu", v: "// map prompts → cornerstone pages" },
      { t: "ok", v: "answer-first briefs, FAQPage-ready" },
    ],
    res: "ranked by impact × effort",
  },
  {
    num: "05",
    nm: "Human gate",
    tag: "principle",
    span: 2,
    title: "Nothing auto-deploys",
    em: "— you approve every change",
    sub: "The pipeline ranks and drafts. A human goblin reviews and ships.",
    term: [
      { t: "cmd", v: "goblin scan … (interrupt_before: human_review)" },
      { t: "warn", v: "⏸ paused — awaiting human approval" },
      { t: "ok", v: "approved fixes → reviewed PRs / CMS drafts" },
    ],
    res: "agentic, but accountable",
  },
];

function Work() {
  return (
    <section
      id="work"
      className="panel"
      data-screen-label="08 Work"
      data-section-name="Case study + method"
    >
      <div className="panel-bar">
        <span className="id">02</span>
        <span>$ ls ./case_study</span>
        <span className="grow"></span>
        <span className="tk">dogfood + method · no fake clients</span>
      </div>
      <div className="grid-lines work-grid">
        {WORK.map((w, i) => (
          <WCard key={w.num} w={w} i={i} />
        ))}
      </div>
    </section>
  );
}
function WCard({ w, i }) {
  const ref = useReveal();
  return (
    <article
      ref={ref}
      className={"wcard reveal" + (w.span === 2 ? " span-2" : "")}
      style={{ transitionDelay: `${i * 0.05}s` }}
      data-cursor-label="open case"
    >
      <div className="wcard-head">
        <span className="num">{w.num}</span>
        <span className="nm">{w.nm}</span>
        <span className="tag">{w.tag}</span>
      </div>
      <div className="wterm">
        {w.term.map((l, j) => (
          <div className="ln" key={j}>
            {l.t === "cmd" && (
              <>
                <span className="pfx">$</span> {l.v}
              </>
            )}
            {l.t === "mu" && <span className="mu">{l.v}</span>}
            {l.t === "ok" && (
              <>
                <span className="ok">✓</span> {l.v}
              </>
            )}
            {l.t === "warn" && (
              <>
                <span className="warn">⚠</span> {l.v}
              </>
            )}
          </div>
        ))}
        <div className="res">{w.res}</div>
      </div>
      <div className="wcard-foot">
        <span className="ttl">
          {w.title}
          {w.em && <em> {w.em}</em>}
        </span>
        <span className="sub">{w.sub}</span>
      </div>
    </article>
  );
}

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
    lead: "Usable by people on assistive tech and legible to crawlers — the same fixes serve both. Automated axe-core audit across real component states (collapsed, open, error) plus a human pass, since tooling alone catches ~57%. Required for government (Section 508 / ADA Title II); never sold as compliance-by-tool.",
    items: [
      "WCAG 2.1 AA + Section 508",
      "Stateful axe-core audit",
      "Human-reviewed remediation",
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
      data-screen-label="09 Services"
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
  { q: "Nothing auto-deploys. A human goblin reviews every change.", src: "principle · 01" },
  { q: "Flat fee. No credits, no meter, no surprise invoice.", src: "principle · 02" },
  { q: "We ship the fixes — not a PDF you implement yourself.", src: "principle · 03" },
  { q: "Schema is hygiene. We chase the real levers: mentions + Bing.", src: "principle · 04" },
];

function Quotes() {
  return (
    <section
      className="panel"
      data-screen-label="11 Quotes"
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
      data-screen-label="12 Scrolls"
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
          <a key={s.num} className="scard" href="#" data-cursor-label="read">
            <div className="meta">
              <span className="num">{s.num}</span>
              <span>
                {s.tag} · {s.date}
              </span>
            </div>
            <h3 dangerouslySetInnerHTML={{ __html: s.title }}></h3>
            <div className="read">read · {s.read}</div>
          </a>
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
    try {
      window.posthog &&
        window.posthog.capture("summon_submitted", { domain: data.domain });
    } catch (_) {}
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
      data-screen-label="13 Contact"
      data-section-name="Summon"
    >
      <div className="panel-bar">
        <span className="id">06</span>
        <span>$ goblin --summon</span>
        <span className="grow"></span>
        <span className="tk">Q3–Q4 2026 open</span>
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
                  A real human-goblin replies within a working day with your
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
              <a href="#">github</a> · <a href="#">x.com</a> ·{" "}
              <a href="#">substack</a>
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

/* ===== LIVE SCAN — goblin@visibility-mesh terminal (ported from handoff, dark+lime) ===== */
let __scanUid = 0; /* monotonic key source — unique across re-runs of the scan loop */
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
    { t: "info", text: "↳ retrieving citation graph (n=2,481 sources)" },
    { t: "warn", text: "competitor detected: 4 mentions · avg position 2.3" },
    { t: "err", text: brand + ": 0 mentions · invisibility cloak ACTIVE" },
    { t: "sep" },
    { t: "issue", sev: "HIGH", text: "missing Organization + Service schema" },
    { t: "issue", sev: "HIGH", text: "weak off-site citation graph" },
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

const SPELLBARS = [
  { name: "schema.entity_graph", pct: 92 },
  { name: "citation.weave", pct: 68 },
  { name: "content.intent_match", pct: 54 },
  { name: "crawler.legibility", pct: 81 },
];

function LiveScan() {
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState("cursed");
  const [pct, setPct] = useState(0);
  const [target, setTarget] = useState(""); // "" = idle demo loop; set on submit
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [reportLines, setReportLines] = useState(null); // real Tier-1 lines; null = use scripted demo
  const bodyRef = useRef(null);

  // (Re)run whenever `target`/`reportLines` change. Idle loops the demo; a submitted
  // domain plays the REAL Tier-1 report when available, else the scripted demo,
  // then reveals the "full audit emailed" confirmation.
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
    if (data.botcheck) return; // honeypot
    const domain = (data.domain || "").trim();
    captureLead("free_scan_requested", { domain, email: data.email });
    setEmail(data.email || "");
    setDone(false);
    setReportLines(null); // reset; scripted demo shows until the real report lands

    // Real Tier-1 hygiene scan. If the backend answers, drive the terminal from
    // the actual report; otherwise the scripted demo plays as a graceful fallback.
    const report = await runHygieneScan(domain);
    if (report && report.ok) {
      setReportLines(reportToTerminal(report));
      // The "aha" moment — a real result rendered. Strongest conversion predictor;
      // PostHog uses it as the mid-funnel step between scan-request and checkout.
      try {
        window.posthog &&
          window.posthog.capture("scan_result_shown", {
            domain,
            hygiene_score: report.report && report.report.hygieneScore,
            findings: report.report && (report.report.findings || []).length,
          });
      } catch (_) {}
    }
    setTarget(domain); // triggers the run (real lines if set, else scripted)

    // Fire the email-gated Tier-2 citation teaser (honest no-op until a key is set).
    runCitationTeaser({ email: data.email, domain, competitor: data.competitor || "" });
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
      data-section-name="Live Scan"
    >
      <div className="panel-bar">
        <span className="id">▸</span>
        <span>$ goblin scan --surface llm</span>
        <span className="grow"></span>
        <span className="tk">live · your prompt surface</span>
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
                {l.t === "sep" && (
                  <span className="mu sep">
                    ────────────────────────────────
                  </span>
                )}
              </div>
            ))}
            <div className="scan-ln">
              <span className="pfx">$</span> <span className="scan-cur" />
            </div>
          </div>
        </div>
        <div className="scan-side">
          {!done ? (
            <form className="scan-form" onSubmit={onScan}>
              <div className="sf-lbl">$ run a free scan</div>
              <input
                name="domain"
                required
                placeholder="yourbrand.com"
                autoComplete="url"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="you@brand.com"
                autoComplete="email"
              />
              <input
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
                run my free scan <span className="arr">→</span>
              </button>
              <div className="scan-disclaimer">
                Instant teaser. Your full multi-surface audit (ChatGPT · Claude
                · Gemini · Perplexity · AI Overviews) is emailed within a
                working day.
              </div>
            </form>
          ) : (
            <div className="sf-ok">
              <div className="sf-ok-mark">✓</div>
              <div>
                <div className="sf-ok-t">scan queued for {target}</div>
                <div className="sf-ok-d">
                  Your full multi-surface audit is on its way to{" "}
                  {email || "your inbox"} within a working day. The teaser above
                  is illustrative — the real run hits all five answer engines.
                </div>
              </div>
            </div>
          )}
          <div className="scan-status-row">
            <span className="k">visibility status</span>
            <span className={"scan-pill " + status}>
              {status === "cursed" ? "✕ cursed" : "⚡ fixable"}
            </span>
          </div>
          <div className="scan-id">
            scan id · GBL-{(pct * 73 + 1031).toString(16).toUpperCase()}
          </div>
          <div className="scan-spells">
            {SPELLBARS.map((s) => (
              <div className="spellbar" key={s.name}>
                <div className="spellbar-top">
                  <span className="nm">› {s.name}</span>
                  <span className="v">{s.pct}%</span>
                </div>
                <div className="spellbar-bar">
                  <i style={{ width: s.pct + "%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ===== VISIBILITY MESH — agentic graph (ported from handoff, dark+lime) ===== */
const MESH_NODES = [
  { id: "intent", x: 2, y: 16, t: "user.intent", v: '"best fleet software"' },
  { id: "llm", x: 30, y: 4, t: "llm.query.expand", v: "GPT · Claude · Gemini" },
  { id: "rag", x: 28, y: 56, t: "rag.retrieve", v: "k=24 sources" },
  { id: "cite", x: 54, y: 34, t: "citation.weave", v: "graph(82 edges)" },
  { id: "schema", x: 52, y: 74, t: "audit.schema·seo·a11y", v: "12 gaps · 1 a11y" },
  { id: "fix", x: 72, y: 16, t: "goblin.recommend", v: "12 ranked fixes" },
  { id: "ship", x: 72, y: 62, t: "human.review → PR", v: "queued · 3 pending" },
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
    "Human-reviewed PRs",
    "A human goblin approves every change before it hits your CMS, schema, or repo. Agentic, but accountable — nothing auto-ships.",
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
        <span className="tk">langgraph workflow · human-gated</span>
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
              <i className="lg-gate" /> human review gate
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
      "Ranked fix queue · 30+ tasks (impact × effort)",
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
    tag: "most chosen",
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
      data-screen-label="10 Pricing"
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
  { id: "03 Scan", name: "Live Scan" },
  { id: "04 Mesh", name: "Visibility Mesh" },
  { id: "05 Stats", name: "Telemetry" },
  { id: "06 Marquee", name: "Keywords" },
  { id: "07 Index", name: "Index / Now" },
  { id: "08 Work", name: "./work" },
  { id: "09 Services", name: "./services" },
  { id: "10 Pricing", name: "Pricing" },
  { id: "11 Quotes", name: "Word on street" },
  { id: "12 Scrolls", name: "./scrolls" },
  { id: "13 Contact", name: "Summon" },
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
          <LiveScan />
          <VisibilityMesh />
          <Stats />
          <Marquee />
          <IndexNow />
          <Work />
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
