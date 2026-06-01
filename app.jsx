/* global React, ReactDOM, TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle, GoblinHead */
const { useState, useEffect, useRef } = React;

/* ===== hooks ===== */
function useLocalTime() {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {const id = setInterval(() => setT(new Date()), 1000);return () => clearInterval(id);}, []);
  return t;
}
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {if (e.isIntersecting) {e.target.classList.add("in");io.unobserve(e.target);}}), { threshold: 0.14 });
    io.observe(el);return () => io.disconnect();
  }, []);
  return ref;
}

/* light / dark theme — single source of truth, persisted */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {return localStorage.getItem("pg-theme") || "dark";} catch (e) {return "dark";}
  });
  useEffect(() => {
    document.body.setAttribute("data-palette", theme === "light" ? "bone" : "");
    try {localStorage.setItem("pg-theme", theme);} catch (e) {}
  }, [theme]);
  return [theme, setTheme];
}

/* ===== cursor ===== */
function Cursor() {
  const cur = useRef(null),lbl = useRef(null);
  const [label, setLabel] = useState("");
  useEffect(() => {
    let x = innerWidth / 2,y = innerHeight / 2,tx = x,ty = y,raf;
    const onMove = (e) => {tx = e.clientX;ty = e.clientY;};
    const tick = () => {
      x += (tx - x) * 0.3;y += (ty - y) * 0.3;
      if (cur.current) cur.current.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
      if (lbl.current) lbl.current.style.transform = `translate(${x}px,${y}px) translate(-50%,calc(-50% + 26px))`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    const onOver = (e) => {
      const el = e.target.closest("[data-cursor-label], a, button, .wcard, .svc-row, .scard");
      if (el) {cur.current?.classList.add("is-hover");lbl.current?.classList.add("is-hover");setLabel(el.getAttribute("data-cursor-label") || (el.matches("a,button") ? "exec" : "open"));} else
      {cur.current?.classList.remove("is-hover");lbl.current?.classList.remove("is-hover");setLabel("");}
    };
    document.addEventListener("mousemove", onMove);document.addEventListener("mouseover", onOver);
    return () => {cancelAnimationFrame(raf);document.removeEventListener("mousemove", onMove);document.removeEventListener("mouseover", onOver);};
  }, []);
  return <><div className="cursor" ref={cur}></div><div className="cursor-label" ref={lbl}>{label}</div></>;
}

/* ===== loader ===== */
function Loader() {
  const [n, setN] = useState(0),[hide, setHide] = useState(false);
  useEffect(() => {
    let i = 0;
    const step = () => {i += Math.random() * 9 + 4;if (i >= 100) {setN(100);setTimeout(() => setHide(true), 340);return;}setN(Math.floor(i));setTimeout(step, 40 + Math.random() * 50);};
    step();
  }, []);
  return (
    <div className={"loader" + (hide ? " hide" : "")}>
      <div>
        <div style={{ marginBottom: 12, color: "var(--muted)" }}>$ goblin crawl --self</div>
        <div className="count">{String(n).padStart(3, "0")}<em>%</em></div>
      </div>
      <div className="right"><div>indexing</div><div><b>schema valid</b></div><div>v 26.05.28</div></div>
    </div>);

}

/* ===== HUD ===== */
function HUDTop({ theme, setTheme }) {
  const t = useLocalTime();
  const time = t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "America/Chicago" });
  return (
    <div className="hud hud-top">
      <div className="hud-left">
        <a className="logo" href="#top" data-cursor-label="home">
          <span className="logo-mark"><GoblinHead size={24} /></span>
          <span>Prompt_Goblin™</span>
        </a>
        <span className="hud-divider"></span>
        <span className="muted">AI&nbsp;SEO / Chicago</span>
      </div>
      <div className="hud-center hud-menu">
        <a href="#work">./work</a>
        <a href="#services">./services</a>
        <a href="#scrolls">./scrolls</a>
        <a href="#contact">./summon</a>
      </div>
      <div className="hud-right">
        <button className="theme-tog" onClick={() => setTheme(theme === "light" ? "dark" : "light")} data-cursor-label="theme" title="Toggle light / dark">
          <span className="sw"></span>
          <span className="lbl">{theme === "light" ? "LIGHT" : "DARK"}</span>
        </button>
        <span className="hud-divider"></span>
        <span><span className="dot"></span>&nbsp;VISIBLE&nbsp;AF</span>
        <span className="hud-divider"></span>
        <span>{time} CHI</span>
      </div>
    </div>);

}
function HUDBottom({ section, total, name }) {
  return (
    <div className="hud hud-bot">
      <div className="hud-left"><span className="muted">41.88°N · 87.63°W</span></div>
      <div className="hud-center"><span className="muted">SECTOR —</span><span>{String(section).padStart(2, "0")}/{String(total).padStart(2, "0")}</span><span>{name}</span></div>
      <div className="hud-right"><span className="muted">EN_US</span><span className="hud-divider"></span><span>↑ top</span></div>
    </div>);

}

/* ===== HERO ===== */
function Hero() {
  const ref = useReveal();
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {setBlink(true);setTimeout(() => setBlink(false), 160);}, 4200);
    return () => clearInterval(id);
  }, []);
  return (
    <section id="top" className="panel hero" data-screen-label="01 Hero" data-section-name="Hero">
      <div className="win-bar">
        <span className="dots"><i /><i /><i /></span>
        <span className="grow">promptgoblin — ~/site — zsh — 132×42</span>
        <span>⌥⌘</span>
      </div>
      <div className="hero-grid">
        <div className="hero-main reveal" ref={ref}>
          <div className="hero-kicker"><span className="b"></span> Core positioning</div>
          <h1 className="hero-title">AI search<br />visibility &amp;<br /><span className="g">technical SEO</span>.</h1>
          <div className="hero-sub">Get found by robots.<br />Stay usable by humans.<span className="cur"></span></div>
          <div className="hero-note">A one-goblin shop that makes you <b>Visible AF</b> — schema, crawlability, and answer-engine optimization that lands you inside the AI results, not buried under them.</div>
          <div className="hero-cta">
            <a className="btn" href="#contact" data-cursor-label="summon">./summon <span className="arr">→</span></a>
            <a className="btn ghost" href="#work" data-cursor-label="browse">./see_work</a>
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
          <div className={"goblin-art" + (blink ? " blink" : "")}><GoblinHead /></div>
          <div className="ascii-noise ascii-bl">{`> crawl ok
> index ok
> cited ✓`}</div>
          <div className="goblin-cap"><span className="bk">▸</span> mascot.exe — online</div>
        </div>
      </div>
    </section>);

}

/* ===== SPELLBOOK ===== */
const SPELLS = [
  { ico: "fire", nm: "FIRE", lv: "LV.7 BURN" },
  { ico: "ice",  nm: "ICE",  lv: "LV.5 FREEZE" },
  { ico: "bolt", nm: "BOLT", lv: "LV.9 SURGE" },
];
function Spellbook() {
  const ref = useReveal();
  return (
    <section className="panel spellbook-sec" data-screen-label="02 Spellbook" data-section-name="Spellbook">
      <div className="spellbook reveal" ref={ref}>
        <div className="sb-head">
          <span className="sb-title"><span className="sb-bolt"><SpriteLightning size={3} /></span> Visibility Spellbook</span>
          <span className="sb-count">4 of 6 cast</span>
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
              </div>
            </div>
          ))}
        </div>
        <div className="sb-foot">
          <span className="path">&gt; schema.entity_graph</span>
          <span className="pct">92%</span>
        </div>
      </div>
    </section>);

}

/* ===== STATS ===== */
const STATS = [
{ v: "1.2k", e: "+", k: "AI answers won" },
{ v: "9,400", k: "Crawl errors killed" },
{ v: "100", e: "%", k: "Schema coverage" },
{ v: "180", e: "ms", k: "Median TTFB" },
{ v: "24", k: "Clients · Visible AF" }];

function Stats() {
  return (
    <section className="panel" data-screen-label="05 Stats" data-section-name="Telemetry">
      <div className="panel-bar"><span className="id">//</span><span>telemetry</span><span className="grow"></span><span className="tk">live · last 90d</span></div>
      <div className="grid-lines stats">
        {STATS.map((s, i) =>
        <div className="stat" key={i}>
            <div className="v">{s.v}<em>{s.e || ""}</em></div>
            <div className="k">{s.k}</div>
          </div>
        )}
      </div>
    </section>);

}

/* ===== MARQUEE ===== */
function Marquee() {
  const words = ["schema.org", "llms.txt", "crawlability", "structured data", "answer engines", "core web vitals", "entity SEO", "JSON-LD", "RAG-ready", "sitemaps", "Visible AF"];
  const run = <span>{words.map((w, i) => <React.Fragment key={i}><span>{w}</span><span className="sep">▪</span></React.Fragment>)}</span>;
  return (
    <section className="panel marquee" data-screen-label="06 Marquee" data-section-name="Keywords">
      <div className="marquee-track">{run}{run}{run}</div>
    </section>);

}

/* ===== INDEX / NOW ===== */
function IndexNow() {
  const ref = useReveal();
  return (
    <section id="index" className="panel" data-screen-label="07 Index" data-section-name="Index / Now">
      <div className="panel-bar"><span className="id">01</span><span>index · now</span><span className="grow"></span><span className="tk">$ goblin status</span></div>
      <div className="grid-lines index-grid">
        <div className="idx-left">
          <div className="h">// now</div>
          <div className="now-row"><span className="k">Open</span><span className="val">2 of 3 slots · <em>Q3 26</em></span></div>
          <div className="now-row"><span className="k">Building</span><span className="val">an llms.txt linter</span></div>
          <div className="now-row"><span className="k">Crawling</span><span className="val">12 client graphs</span></div>
          <div className="now-row"><span className="k">Reading</span><span className="val">Google QRG, again</span></div>
          <div className="now-row"><span className="k">Based</span><span className="val">Logan Square, CHI</span></div>
        </div>
        <div className="idx-right reveal" ref={ref}>
          <div className="statement">
            <p className="line-mask"><span style={{ "--d": "0s" }}>I make sites <em>legible</em></span></p>
            <p className="line-mask"><span style={{ "--d": ".07s" }}>to crawlers and LLMs —</span></p>
            <p className="line-mask"><span style={{ "--d": ".14s" }}>so you show up <em>where</em></span></p>
            <p className="line-mask"><span style={{ "--d": ".21s" }}>the answer gets written.</span></p>
          </div>
          <div className="body">
            Two years deep in technical SEO and the new world of answer engines.
            I ship <em>schema</em>, fix <em>crawl paths</em>, write the <em>llms.txt</em>, and
            harden Core Web Vitals — small, urgent jobs that a big agency would
            scope into a quarter. I move in days and leave you a test suite.
          </div>
        </div>
      </div>
    </section>);

}

/* ===== WORK ===== */
const WORK = [
{
  num: "01", nm: "Northwind", tag: "Retail · 3wk", span: 2,
  title: "Northwind", em: "— cited in ChatGPT", sub: "Product schema + llms.txt → cited in AI answers",
  term: [
  { t: "cmd", v: "goblin audit northwind.com" },
  { t: "mu", v: "// crawlable pages  142 → 2,910" },
  { t: "ok", v: "+ Product, FAQ, Breadcrumb schema" },
  { t: "ok", v: "+ llms.txt + sitemap rebuilt" }],
  res: "now cited in ChatGPT + Perplexity · 3 wk"
},
{
  num: "02", nm: "Voltspark", tag: "SaaS · 2wk",
  title: "Voltspark", em: "", sub: "Core Web Vitals rescue",
  term: [
  { t: "cmd", v: "goblin vitals --fix" },
  { t: "warn", v: "LCP 4.1s  CLS 0.28" },
  { t: "ok", v: "LCP 1.3s  CLS 0.02" }],
  res: "all green · indexed in 6 days"
},
{
  num: "03", nm: "Cinder", tag: "Legal · 4wk",
  title: "Cinder", em: "", sub: "Entity SEO over 12k docs",
  term: [
  { t: "cmd", v: "goblin entities build" },
  { t: "mu", v: "// 12,418 docs → graph" },
  { t: "ok", v: "knowledge panel claimed" }],
  res: "branded SERP locked · 4 wk"
},
{
  num: "04", nm: "Glasstown", tag: "Fintech · 1wk",
  title: "Glasstown", em: "", sub: "Crawl-budget audit",
  term: [
  { t: "cmd", v: "goblin crawl --trace" },
  { t: "warn", v: "94% budget on facets" },
  { t: "ok", v: "robots + canonical patch" }],
  res: "crawl waste -94% · 1 wk"
},
{
  num: "05", nm: "Tiderift", tag: "Research · 5wk", span: 2,
  title: "Tiderift", em: "— Visible AF", sub: "Full answer-engine optimization program",
  term: [
  { t: "cmd", v: "goblin aeo --full tiderift.io" },
  { t: "mu", v: "// schema, llms.txt, vitals, entities" },
  { t: "ok", v: "+ 1.2k AI answer citations / mo" },
  { t: "ok", v: "+ 38% assisted conversions" }],
  res: "officially Visible AF · 5 wk"
}];

function Work() {
  return (
    <section id="work" className="panel" data-screen-label="08 Work" data-section-name="Selected Work">
      <div className="panel-bar"><span className="id">02</span><span>$ ls ./work</span><span className="grow"></span><span className="tk">14 jobs · 2024–26</span></div>
      <div className="grid-lines work-grid">
        {WORK.map((w, i) => <WCard key={w.num} w={w} i={i} />)}
      </div>
    </section>);

}
function WCard({ w, i }) {
  const ref = useReveal();
  return (
    <article ref={ref} className={"wcard reveal" + (w.span === 2 ? " span-2" : "")} style={{ transitionDelay: `${i * 0.05}s` }} data-cursor-label="open case">
      <div className="wcard-head"><span className="num">{w.num}</span><span className="nm">{w.nm}</span><span className="tag">{w.tag}</span></div>
      <div className="wterm">
        {w.term.map((l, j) =>
        <div className="ln" key={j}>
            {l.t === "cmd" && <><span className="pfx">$</span> {l.v}</>}
            {l.t === "mu" && <span className="mu">{l.v}</span>}
            {l.t === "ok" && <><span className="ok">✓</span> {l.v}</>}
            {l.t === "warn" && <><span className="warn">⚠</span> {l.v}</>}
          </div>
        )}
        <div className="res">{w.res}</div>
      </div>
      <div className="wcard-foot"><span className="ttl">{w.title}{w.em && <em> {w.em}</em>}</span><span className="sub">{w.sub}</span></div>
    </article>);

}

/* ===== SERVICES ===== */
const SVCS = [
{ num: "(i)", title: "Technical SEO", lead: "The plumbing: crawl paths, indexation, canonicals, robots, sitemaps — fixed so nothing leaks crawl budget.", items: ["Crawl audits", "Indexation", "Canonicals", "Robots & sitemaps"] },
{ num: "(ii)", title: "Schema & structured data", lead: "JSON-LD that tells robots exactly what you are, so they cite you with confidence.", items: ["JSON-LD", "Entity markup", "FAQ / HowTo", "Rich results"] },
{ num: "(iii)", title: "AI / answer-engine SEO", lead: "Get surfaced inside ChatGPT, Perplexity, and AI Overviews — not just page two of blue links.", items: ["llms.txt", "AEO strategy", "Citation tuning", "RAG-readiness"] },
{ num: "(iv)", title: "Core Web Vitals", lead: "Make it fast for humans and bots alike. Green vitals, real-device tested.", items: ["LCP / CLS / INP", "Asset budgets", "Edge & caching", "Lab + field"] },
{ num: "(v)", title: "Content for robots + humans", lead: "Pages that read well to a person and parse cleanly for a model. Both audiences, one draft.", items: ["Info architecture", "Heading logic", "Internal links", "Editorial passes"] }];

function Services() {
  const [open, setOpen] = useState(0);
  return (
    <section id="services" className="panel" data-screen-label="09 Services" data-section-name="Services">
      <div className="panel-bar"><span className="id">03</span><span>$ man goblin</span><span className="grow"></span><span className="tk">five services · one goblin</span></div>
      <div className="panel-body" style={{ padding: 0 }}>
        {SVCS.map((s, i) =>
        <div key={s.num} className={"svc-row" + (open === i ? " open" : "")} onClick={() => setOpen(open === i ? -1 : i)} data-cursor-label={open === i ? "close" : "open"}>
            <div className="num">{s.num}</div>
            <div className="ttl">{s.title.split(" ").map((w, idx) => idx === 0 ? <em key={idx}>{w} </em> : <span key={idx}>{w} </span>)}</div>
            <div>
              <div className="lead">{s.lead}</div>
              <div className="desc"><ul>{s.items.map((it) => <li key={it}>{it}</li>)}</ul></div>
            </div>
            <div className="tog">+</div>
          </div>
        )}
      </div>
    </section>);

}

/* ===== QUOTES ===== */
const QUOTES = [
{ q: "We're in the AI answers now.", src: "VP Growth · Northwind" },
{ q: "Ships faster than our PMs.", src: "Founder · Voltspark" },
{ q: "Finally, green vitals.", src: "Eng Lead · Cinder" },
{ q: "Visible AF. For real.", src: "CMO · Tiderift" }];

function Quotes() {
  return (
    <section className="panel" data-screen-label="10 Quotes" data-section-name="Word on the street">
      <div className="panel-bar"><span className="id">04</span><span>word on the street</span><span className="grow"></span><span className="tk">grep ./reviews</span></div>
      <div className="grid-lines quotes">
        {QUOTES.map((x, i) =>
        <div className="quote" key={i}>
            <div className="stars">★★★★★</div>
            <div className="q">{x.q}</div>
            <div className="src">{x.src}</div>
          </div>
        )}
      </div>
    </section>);

}

/* ===== SCROLLS ===== */
const SCROLLS = [
{ num: "N.01", date: "May 2026", read: "8 min", tag: "essay", title: "What <em>llms.txt</em> is, and why your site needs one." },
{ num: "N.02", date: "Apr 2026", read: "5 min", tag: "field note", title: "Schema is just <em>telling robots the truth</em>, in JSON." },
{ num: "N.03", date: "Mar 2026", read: "11 min", tag: "teardown", title: "How a site gets <em>cited</em> by ChatGPT." }];

function Scrolls() {
  return (
    <section id="scrolls" className="panel" data-screen-label="11 Scrolls" data-section-name="Scrolls">
      <div className="panel-bar"><span className="id">05</span><span>$ cat ./scrolls/*.md</span><span className="grow"></span><span className="tk">field notes</span></div>
      <div className="grid-lines scrolls">
        {SCROLLS.map((s) =>
        <a key={s.num} className="scard" href="#" data-cursor-label="read">
            <div className="meta"><span className="num">{s.num}</span><span>{s.tag} · {s.date}</span></div>
            <h3 dangerouslySetInnerHTML={{ __html: s.title }}></h3>
            <div className="read">read · {s.read}</div>
          </a>
        )}
      </div>
    </section>);

}

/* ===== CONTACT / SUMMON — lead intake + payment-ready ===== */
const WEB3FORMS_KEY = "REPLACE_WITH_WEB3FORMS_ACCESS_KEY"; // free static-site form backend — web3forms.com
const STRIPE_SCOUT_LINK = "https://buy.stripe.com/REPLACE_scout_audit"; // Stripe Payment Link for the Scout audit deposit

function Contact() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const data = Object.fromEntries(new FormData(e.target).entries());
    try { window.posthog && window.posthog.capture("summon_submitted", { domain: data.domain }); } catch (_) {}
    setSending(true);
    // If the form backend key isn't set yet, capture locally and show success (demo mode).
    if (WEB3FORMS_KEY.indexOf("REPLACE") !== -1) {
      console.info("[summon] form backend not configured — captured locally:", data);
      setSending(false); setSent(true); return;
    }
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: "New goblin summon ✦ " + (data.domain || ""), from_name: "promptgoblin.io", ...data }),
      });
      if (res.ok) setSent(true); else setErr("Something cursed happened. Email hi@promptgoblin.io.");
    } catch (_) {
      setErr("A network goblin ate it. Email hi@promptgoblin.io.");
    }
    setSending(false);
  };

  return (
    <section id="contact" className="panel" data-screen-label="12 Contact" data-section-name="Summon">
      <div className="panel-bar"><span className="id">06</span><span>$ goblin --summon</span><span className="grow"></span><span className="tk">Q3–Q4 2026 open</span></div>
      <div className="grid-lines contact-grid">
        <div className="contact-main">
          <div className="big"><a href="#contact" data-cursor-label="summon">Summon<em>.</em><span className="arr">→</span></a></div>
          <div className="avail">Drop your domain and what you want to get cited for — I'll run a <em>free visibility scan</em> and send back the gaps. Best for jobs measured in <em>days</em>, not quarters.</div>

          {!sent ? (
            <form className="summon-form" onSubmit={submit}>
              <div className="sf-grid">
                <label className="sf-field">
                  <span className="sf-lbl">$ domain</span>
                  <input name="domain" required placeholder="yourbrand.com" autoComplete="url" />
                </label>
                <label className="sf-field">
                  <span className="sf-lbl">$ email</span>
                  <input name="email" type="email" required placeholder="you@brand.com" autoComplete="email" />
                </label>
              </div>
              <label className="sf-field">
                <span className="sf-lbl">$ get_cited_for</span>
                <input name="target" placeholder={'e.g. "best fleet software"'} />
              </label>
              <input type="text" name="botcheck" className="sf-hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className="sf-actions">
                <button className="btn" type="submit" disabled={sending} data-cursor-label="run scan">
                  {sending ? "casting…" : "run my free scan"} <span className="arr">→</span>
                </button>
                <a className="btn ghost" href={STRIPE_SCOUT_LINK} data-cursor-label="reserve">reserve a Scout audit</a>
              </div>
              {err && <div className="sf-err">⚠ {err}</div>}
            </form>
          ) : (
            <div className="sf-ok">
              <div className="sf-ok-mark">✓</div>
              <div>
                <div className="sf-ok-t">summon received — invisibility cloak: BREAKING</div>
                <div className="sf-ok-d">A real human-goblin replies within a working day with your free scan. Check your inbox (and spam — goblins lurk there too).</div>
              </div>
            </div>
          )}
        </div>
        <div className="contact-side">
          <div className="cside-row"><span className="k">$ mail</span><span className="v big"><a href="mailto:hi@promptgoblin.io">hi@promptgoblin.io</a></span></div>
          <div className="cside-row"><span className="k">$ chat</span><span className="v">@promptgoblin</span></div>
          <div className="cside-row"><span className="k">$ ls ./elsewhere</span><span className="v"><a href="#">github</a> · <a href="#">x.com</a> · <a href="#">substack</a></span></div>
          <div className="cside-row"><span className="k">$ pwd</span><span className="v">Chicago, IL · by appt</span></div>
        </div>
      </div>
      <div className="colophon">
        <span>© Prompt_Goblin™ 2024–2026 · Visible AF</span>
        <span>Set in Press Start 2P · VT323 · JetBrains Mono</span>
      </div>
    </section>);

}

/* ===== LIVE SCAN — goblin@visibility-mesh terminal (ported from handoff, dark+lime) ===== */
let __scanUid = 0; /* monotonic key source — unique across re-runs of the scan loop */
const SCAN_SCRIPT = [
  { t: "cmd",  text: "goblin scan --surface llm" },
  { t: "kv",   k: "query", v: '"best enterprise fleet software"' },
  { t: "info", text: "checking ChatGPT / Claude / Gemini / Perplexity" },
  { t: "info", text: "↳ retrieving citation graph (n=2,481 sources)" },
  { t: "warn", text: "competitor detected: 4 mentions · avg position 2.3" },
  { t: "err",  text: "your brand: 0 mentions · invisibility cloak ACTIVE" },
  { t: "sep" },
  { t: "issue", sev: "HIGH", text: "missing Organization + Service schema" },
  { t: "issue", sev: "HIGH", text: "weak off-site citation graph" },
  { t: "issue", sev: "MED",  text: "thin comparison content (vs. 6 competitors)" },
  { t: "issue", sev: "MED",  text: "no LLM-readable proof pages or trust assets" },
  { t: "sep" },
  { t: "ok",   text: "goblin.recommend → schema + citation assets + intent pages" },
  { t: "ok",   text: "invisibility cloak: BREAKABLE" },
];

const SPELLBARS = [
  { name: "schema.entity_graph",  pct: 92 },
  { name: "citation.weave",       pct: 68 },
  { name: "content.intent_match", pct: 54 },
  { name: "crawler.legibility",   pct: 81 },
];

function LiveScan() {
  const [lines, setLines] = useState([]);
  const [status, setStatus] = useState("cursed");
  const [pct, setPct] = useState(0);
  const bodyRef = useRef(null);

  useEffect(() => {
    let i = 0, cancelled = false, timer;
    const tick = () => {
      if (cancelled) return;
      if (i >= SCAN_SCRIPT.length) {
        setStatus("fixable");
        timer = setTimeout(() => {
          setLines([]); setStatus("cursed"); setPct(0); i = 0;
          timer = setTimeout(tick, 1400);
        }, 4200);
        return;
      }
      setLines((p) => [...p, { ...SCAN_SCRIPT[i], id: __scanUid++ }]);
      setPct(Math.round(((i + 1) / SCAN_SCRIPT.length) * 100));
      i++;
      timer = setTimeout(tick, 300 + Math.random() * 220);
    };
    timer = setTimeout(tick, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <section id="scan" className="panel" data-screen-label="03 Scan" data-section-name="Live Scan">
      <div className="panel-bar"><span className="id">▸</span><span>$ goblin scan --surface llm</span><span className="grow"></span><span className="tk">live · your prompt surface</span></div>
      <div className="grid-lines scan-grid">
        <div className="scan-term">
          <div className="win-bar">
            <span className="dots"><i /><i /><i /></span>
            <span className="grow">goblin@visibility-mesh — /scan</span>
            <span>{String(pct).padStart(3, "0")}%</span>
          </div>
          <div className="scan-body" ref={bodyRef}>
            {lines.map((l) => (
              <div className="scan-ln" key={l.id}>
                {l.t === "cmd"  && <><span className="pfx">$</span> {l.text}</>}
                {l.t === "info" && <><span className="pfx">›</span> <span className="mu">{l.text}</span></>}
                {l.t === "kv"   && <><span className="pfx">›</span> <span className="key">{l.k}:</span> <span className="mu">{l.v}</span></>}
                {l.t === "warn" && <><span className="warn">▲</span> <span className="warn">{l.text}</span></>}
                {l.t === "err"  && <><span className="err">✕</span> <span className="err">{l.text}</span></>}
                {l.t === "issue"&& <><span className={l.sev === "HIGH" ? "err" : "mu"}>{l.sev === "HIGH" ? "▲" : "·"}</span> <span className="sev">[{l.sev}]</span> <span className="mu">{l.text}</span></>}
                {l.t === "ok"   && <><span className="ok">✓</span> <span className="ok">{l.text}</span></>}
                {l.t === "sep"  && <span className="mu sep">────────────────────────────────</span>}
              </div>
            ))}
            <div className="scan-ln"><span className="pfx">$</span> <span className="scan-cur" /></div>
          </div>
        </div>
        <div className="scan-side">
          <div className="scan-status-row">
            <span className="k">visibility status</span>
            <span className={"scan-pill " + status}>{status === "cursed" ? "✕ cursed" : "⚡ fixable"}</span>
          </div>
          <div className="scan-id">scan id · GBL-{(pct * 73 + 1031).toString(16).toUpperCase()}</div>
          <div className="scan-spells">
            {SPELLBARS.map((s) => (
              <div className="spellbar" key={s.name}>
                <div className="spellbar-top"><span className="nm">› {s.name}</span><span className="v">{s.pct}%</span></div>
                <div className="spellbar-bar"><i style={{ width: s.pct + "%" }} /></div>
              </div>
            ))}
          </div>
          <div className="scan-note">A free scan of your real prompt surface. The full <b>Scout</b> audit ships 30+ ranked, paste-ready fixes.</div>
        </div>
      </div>
    </section>);

}

/* ===== VISIBILITY MESH — agentic graph (ported from handoff, dark+lime) ===== */
const MESH_NODES = [
  { id: "intent", x: 2,  y: 16, t: "user.intent",       v: '"best fleet software"' },
  { id: "llm",    x: 30, y: 4,  t: "llm.query.expand",  v: "GPT · Claude · Gemini" },
  { id: "rag",    x: 28, y: 56, t: "rag.retrieve",      v: "k=24 sources" },
  { id: "cite",   x: 54, y: 34, t: "citation.weave",    v: "graph(82 edges)" },
  { id: "schema", x: 52, y: 74, t: "schema.diff",       v: "missing: Org+Svc" },
  { id: "fix",    x: 72, y: 16, t: "goblin.recommend",  v: "12 ranked fixes" },
  { id: "ship",   x: 72, y: 62, t: "human.review → PR", v: "queued · 3 pending" },
];
const MESH_EDGES = [
  ["intent", "llm"], ["intent", "rag"], ["llm", "cite"], ["rag", "cite"],
  ["rag", "schema"], ["cite", "fix"], ["schema", "fix"], ["fix", "ship"],
];
const MESH_STEPS = [
  ["01", "Listen to prompt surfaces", "We sample real buyer queries across ChatGPT, Claude, Gemini, Perplexity, and Google AI Overviews — not just keyword tools."],
  ["02", "Retrieve & diff citation graph", "Map who LLMs actually cite for your category, then diff against your domain to expose missing sources."],
  ["03", "Schema + content gap audit", "Detect missing entities, weak structured data, thin comparison content, and unindexable proof pages."],
  ["04", "Goblin recommendation engine", "Each gap becomes a ranked, scoped task with impact, effort, and exact paste-ready snippets."],
  ["05", "Human-reviewed PRs", "A human goblin reviews every change before it hits your CMS, schema, or content repo. No silent autonomous ops."],
  ["06", "Loop on cadence", "The graph re-runs weekly. Visibility, citations, and entity coverage become a tracked KPI, not a vibe."],
];

function VisibilityMesh() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % MESH_NODES.length), 1100);
    return () => clearInterval(id);
  }, []);
  const activeId = MESH_NODES[active].id;
  const activeEdge = MESH_EDGES[active % MESH_EDGES.length];
  const VB_W = 900, VB_H = 480;
  const pos = (id) => {
    const n = MESH_NODES.find((x) => x.id === id);
    return { x: (n.x / 100) * VB_W + 92, y: (n.y / 100) * VB_H + 30 };
  };

  return (
    <section id="mesh" className="panel" data-screen-label="04 Mesh" data-section-name="Visibility Mesh">
      <div className="panel-bar"><span className="id">▸</span><span>$ goblin graph --run</span><span className="grow"></span><span className="tk">langgraph workflow · human-gated</span></div>
      <div className="grid-lines mesh-grid">
        <div className="mesh-stage">
          <div className="mesh-bg" />
          <div className="mesh-head">
            <span className="mh-l">goblin-graph.runtime</span>
            <span className="mh-r">⚡ executing · {String(active + 1).padStart(2, "0")} / {String(MESH_NODES.length).padStart(2, "0")}</span>
          </div>
          <div className="mesh-svg">
            <svg width="100%" height="100%" viewBox={`0 0 ${VB_W + 200} ${VB_H + 60}`} preserveAspectRatio="none">
              {MESH_EDGES.map(([a, b], i) => {
                const A = pos(a), B = pos(b);
                const on = activeEdge[0] === a && activeEdge[1] === b;
                return (
                  <g key={i}>
                    <line x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                      stroke={on ? "var(--lime)" : "var(--line-2)"}
                      strokeWidth={on ? 2 : 1}
                      strokeDasharray={on ? "0" : "4 5"} />
                    {on && (
                      <circle r="4" fill="var(--lime)">
                        <animateMotion dur="1.1s" repeatCount="indefinite" path={`M${A.x},${A.y} L${B.x},${B.y}`} />
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
            {MESH_NODES.map((n) => (
              <div key={n.id} className={"mnode" + (activeId === n.id ? " on" : "")} style={{ left: n.x + "%", top: n.y + "%" }}>
                <span className="pin" />
                <div className="t">{n.t}</div>
                <div className="v">{n.v}</div>
              </div>
            ))}
          </div>
          <div className="mesh-legend">
            <span><i className="lg-on" /> active path</span>
            <span><i className="lg-idle" /> idle edge</span>
            <span><i className="lg-gate" /> human review gate</span>
          </div>
        </div>
        <ol className="mesh-steps">
          {MESH_STEPS.map(([num, t, d]) => (
            <li key={num}>
              <div className="sn">{num}</div>
              <div><div className="st">{t}</div><div className="sd">{d}</div></div>
            </li>
          ))}
        </ol>
      </div>
    </section>);

}

/* ===== section spy ===== */
function useSectionSpy(ids) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const els = ids.map((id) => document.querySelector(`[data-screen-label="${id}"]`)).filter(Boolean);
    const io = new IntersectionObserver((es) => es.forEach((e) => {if (e.isIntersecting) {const idx = ids.indexOf(e.target.getAttribute("data-screen-label"));if (idx >= 0) setActive(idx);}}), { threshold: 0.3 });
    els.forEach((el) => io.observe(el));return () => io.disconnect();
  }, []);
  return active;
}

/* ===== tweaks ===== */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "grain": true,
  "cursor": true,
  "motion": "med",
  "density": "default",
  "displaySize": "md"
} /*EDITMODE-END*/;

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
      <TweakRadio label="Display size" value={t.displaySize} options={[{ value: "sm", label: "Refined" }, { value: "md", label: "Default" }, { value: "lg", label: "Massive" }]} onChange={(v) => setTweak("displaySize", v)} />

      <TweakSection label="Motion & layout" />
      <TweakRadio label="Motion" value={t.motion} options={[{ value: "low", label: "Calm" }, { value: "med", label: "Default" }, { value: "high", label: "Loud" }]} onChange={(v) => setTweak("motion", v)} />
      <TweakRadio label="Density" value={t.density} options={[{ value: "tight", label: "Tight" }, { value: "default", label: "Default" }, { value: "airy", label: "Airy" }]} onChange={(v) => setTweak("density", v)} />

      <TweakSection label="Atmosphere" />
      <TweakToggle label="Grain" value={t.grain} onChange={(v) => setTweak("grain", v)} />
      <TweakToggle label="Custom cursor" value={t.cursor} onChange={(v) => setTweak("cursor", v)} />
    </TweaksPanel>);

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
{ id: "10 Quotes", name: "Word on street" },
{ id: "11 Scrolls", name: "./scrolls" },
{ id: "12 Contact", name: "Summon" }];

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
          <Quotes />
          <Scrolls />
          <Contact />
        </div>
      </main>
      <HUDBottom section={active + 1} total={SECTIONS.length} name={SECTIONS[active].name} />
      <TweaksMount />
    </>);

}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);