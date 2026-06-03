"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Panel, PanelBar } from "@/components/ui/Panel/Panel";
import { captureEvent, captureLead } from "@/lib/analytics";
import { runCitationTeaser, runHygieneScan, type ScanReport } from "@/lib/scan-api";
import { SAMPLE_LINES, SCAN_PHASES, type ScanLine, type ScanLineInput, type ScanStep } from "./scan.data";
import { phaseTone, phaseValues, scanHost, scoreBand } from "./scan-report";
import { ScanResult } from "./ScanResult";
import { ScanStepper } from "./ScanStepper";
import styles from "./LiveScan.module.css";

type Mode = "idle" | "scanning" | "results" | "error";

let scanUid = 0;
const mkLine = (line: ScanLineInput): ScanLine => ({ ...line, id: scanUid++ });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const PILL: Record<string, string | undefined> = {
  ok: styles.pillOk,
  warn: styles.pillWarn,
  bad: styles.pillBad,
  scanning: styles.pillScanning,
  cursed: styles.pillCursed,
  fixable: styles.pillFixable,
};
const PV: Record<string, string | undefined> = { ok: styles.pvOk, warn: styles.pvWarn, bad: styles.pvBad };

const Line = ({ line }: { line: ScanLine }) => {
  switch (line.t) {
    case "cmd":
      return (
        <>
          <span className={styles.pfx}>$</span> {line.text}
        </>
      );
    case "info":
      return (
        <>
          <span className={styles.pfx}>›</span> <span className={styles.mu}>{line.text}</span>
        </>
      );
    case "kv":
      return (
        <>
          <span className={styles.pfx}>›</span> <span className={styles.key}>{line.k}:</span>{" "}
          <span className={styles.mu}>{line.v}</span>
        </>
      );
    case "phase":
      return (
        <>
          <span className={styles.pfx}>›</span> <span className={styles.key}>{line.k}</span>
          <span className={styles.phDots}> ··· </span>
          <span className={clsx(styles.pv, PV[line.tone ?? "ok"])}>{line.v}</span>
        </>
      );
    case "warn":
      return (
        <>
          <span className={styles.warn}>▲</span> <span className={styles.warn}>{line.text}</span>
        </>
      );
    case "err":
      return (
        <>
          <span className={styles.err}>✕</span> <span className={styles.err}>{line.text}</span>
        </>
      );
    case "issue":
      return (
        <>
          <span className={line.sev === "HIGH" ? styles.err : styles.mu}>
            {line.sev === "HIGH" ? "▲" : "·"}
          </span>{" "}
          <span className={styles.sev}>[{line.sev}]</span> <span className={styles.mu}>{line.text}</span>
        </>
      );
    case "ok":
      return (
        <>
          <span className={styles.ok}>✓</span> <span className={styles.ok}>{line.text}</span>
        </>
      );
    case "sample":
      return <span className={styles.sampleTag}>{line.text}</span>;
    case "sep":
      return <span className={clsx(styles.mu, styles.sep)}>────────────────────────────────</span>;
    default:
      return null;
  }
};

export const LiveScan = () => {
  const [mode, setMode] = useState<Mode>("idle");
  const [lines, setLines] = useState<ScanLine[]>([]);
  const [pct, setPct] = useState(0);
  const [scanLabel, setScanLabel] = useState("");
  const [steps, setSteps] = useState<ScanStep[]>([]);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [email, setEmail] = useState("");
  const [target, setTarget] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const runRef = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Idle: loop the SAMPLE reveal. The run token cancels it the moment a real
  // scan starts and makes it immune to StrictMode double-invoke (no doubled lines).
  useEffect(() => {
    if (mode !== "idle") return;
    const run = ++runRef.current;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
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
      setLines((prev) => [...prev, mkLine(SAMPLE_LINES[i])]);
      setPct(Math.round(((i + 1) / SAMPLE_LINES.length) * 100));
      i += 1;
      timer = setTimeout(tick, 300 + Math.random() * 220);
    };
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [mode]);

  // Keep the terminal scrolled to the newest line.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length, mode]);

  const resetToIdle = () => {
    runRef.current += 1;
    setReport(null);
    setErrorMsg("");
    setTarget("");
    setEmail("");
    setMode("idle");
  };

  const onScan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    if (data.botcheck) return; // honeypot
    const domain = (data.domain || "").trim();
    const competitor = (data.competitor || "").trim();
    const host = scanHost(domain);
    const scanId = `scan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    captureLead("free_scan_requested", { domain, email: data.email, competitor, scan_id: scanId });
    setEmail(data.email || "");
    setTarget(host);

    const run = ++runRef.current;
    const alive = () => runRef.current === run;
    setMode("scanning");
    setReport(null);
    setErrorMsg("");
    setLines([mkLine({ t: "cmd", text: `goblin scan --surface hygiene --domain ${host}` })]);
    setPct(8);
    setSteps(SCAN_PHASES.map((p) => ({ key: p.key, label: p.label, status: "pending", value: null, tone: "ok" })));

    // Fire the REAL request immediately, narrate genuine operations while it runs.
    const respPromise = runHygieneScan(domain);
    for (let idx = 0; idx < SCAN_PHASES.length; idx += 1) {
      if (!alive()) return;
      setScanLabel(SCAN_PHASES[idx].label);
      setSteps((prev) => prev.map((s, i) => (i <= idx ? { ...s, status: "active" } : s)));
      setPct(Math.min(78, 12 + (idx + 1) * 13));
      await sleep(420 + Math.random() * 160);
    }
    if (!alive()) return;
    setScanLabel("compiling report");

    let resp = null;
    try {
      resp = await respPromise;
    } catch {
      resp = null;
    }
    if (!alive()) return;

    // Honest failure path — a real submit NEVER falls back to demo theater.
    if (!resp || !resp.ok || !resp.report) {
      const why = resp?.error || "host unreachable or not public";
      setLines((prev) => [...prev, mkLine({ t: "err", text: `scan failed · ${why}` })]);
      setErrorMsg(why);
      setScanLabel("");
      setPct(100);
      setMode("error");
      captureEvent("scan_failed", { scan_id: scanId, domain, reason: "tier1_unreachable" });
      return;
    }

    // Real result — reveal MEASURED phase values one by one.
    const r = resp.report;
    const pv = phaseValues(r);
    setScanLabel("");
    captureEvent("scan_result_shown", {
      scan_id: scanId,
      domain,
      hygiene_score: r.hygieneScore,
      findings: (r.findings || []).length,
    });

    for (let j = 0; j < SCAN_PHASES.length; j += 1) {
      const p = SCAN_PHASES[j];
      if (!alive()) return;
      await sleep(240 + Math.random() * 120);
      if (!alive()) return;
      const tone = phaseTone(r, p.key);
      setLines((prev) => [...prev, mkLine({ t: "phase", k: p.label, v: pv[p.key], tone })]);
      setSteps((prev) => prev.map((s, i) => (i === j ? { ...s, status: "done", value: pv[p.key], tone } : s)));
      setPct((prev) => Math.min(94, prev + 4));
    }
    if (!alive()) return;
    setLines((prev) => [...prev, mkLine({ t: "sep" })]);

    const findings = (r.findings || []).slice(0, 6);
    for (const f of findings) {
      if (!alive()) return;
      await sleep(200 + Math.random() * 120);
      if (!alive()) return;
      setLines((prev) => [
        ...prev,
        mkLine({
          t: "issue",
          sev: (f.severity ?? 0) >= 4 ? "HIGH" : f.severity === 3 ? "MED" : "LOW",
          text: f.detail || "",
        }),
      ]);
    }
    if (!findings.length) {
      setLines((prev) => [...prev, mkLine({ t: "ok", text: "no hygiene gaps found — clean surface" })]);
    }
    if (!alive()) return;
    await sleep(220);
    setLines((prev) => [...prev, mkLine({ t: "sep" }), mkLine({ t: "ok", text: resp.summary || "scan complete" })]);
    setReport(r);
    setPct(100);
    setMode("results");

    // Email-gated Tier-2 citation teaser (honest no-op until a key is set).
    if (!competitor) {
      captureEvent("tier2_skipped_no_competitor", { scan_id: scanId, domain });
    } else {
      runCitationTeaser({ email: data.email, domain, competitor }).then((tier2) => {
        if (!tier2) return captureEvent("tier2_error", { scan_id: scanId, domain, competitor, reason: "network_or_unreachable" });
        if (tier2.ok && tier2.configured && tier2.teaser) {
          const results = tier2.teaser.results || [];
          captureEvent("tier2_result_shown", {
            scan_id: scanId,
            domain,
            competitor,
            engine: tier2.teaser.engine || "perplexity",
            queries: results.length,
            client_cited_count: results.filter((x) => x.clientCited).length,
            competitor_cited_count: results.filter((x) => x.competitorCited).length,
          });
        } else if (tier2.ok && tier2.configured === false) {
          captureEvent("tier2_no_key", { scan_id: scanId, domain, competitor });
        } else if (tier2.retryAfterHours) {
          captureEvent("tier2_rate_limited", { scan_id: scanId, domain, competitor, retry_after_hours: tier2.retryAfterHours });
        } else {
          captureEvent("tier2_error", { scan_id: scanId, domain, competitor, status: tier2.error || "unknown" });
        }
      });
    }
  };

  const band = report ? scoreBand(report.hygieneScore) : null;
  const statusPill =
    mode === "results" && band ? band.key : mode === "scanning" ? "scanning" : mode === "error" ? "bad" : "cursed";
  const statusText =
    mode === "results" && band
      ? `${band.key === "ok" ? "✓ " : band.key === "warn" ? "⚡ " : "✕ "}${band.label}`
      : mode === "scanning"
        ? "… scanning"
        : mode === "error"
          ? "✕ failed"
          : "✕ cursed";
  const barNote =
    mode === "results"
      ? "live · real result"
      : mode === "scanning"
        ? "live · scanning your domain"
        : mode === "error"
          ? "scan failed"
          : "sample · enter your domain for a real scan";

  return (
    <Panel id="scan" cursor="./free-scan">
      <PanelBar command="$ goblin scan --surface hygiene" note={barNote} />
      <div className={clsx("grid-lines", styles.grid)}>
        <div className={styles.term}>
          <div className={styles.winBar}>
            <span className={styles.dots}>
              <i />
              <i />
              <i />
            </span>
            <span className={styles.grow}>goblin@visibility-mesh — /scan</span>
            <span>{String(pct).padStart(3, "0")}%</span>
          </div>
          <div className={styles.progress} aria-hidden="true">
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.body} ref={bodyRef}>
            {lines.map((line) => (
              <div className={styles.line} key={line.id}>
                <Line line={line} />
              </div>
            ))}
            {mode === "scanning" ? (
              <div className={clsx(styles.line, styles.running)}>
                <span className={styles.pfx}>›</span> <span className={styles.mu}>{scanLabel || "scanning"}</span>{" "}
                <span className={styles.cur} />
              </div>
            ) : (
              <div className={styles.line}>
                <span className={styles.pfx}>$</span> <span className={styles.cur} />
              </div>
            )}
          </div>
        </div>

        <div className={styles.side}>
          {mode === "results" && report && band ? (
            <ScanResult report={report} email={email} target={target} band={band} steps={steps} onReset={resetToIdle} />
          ) : mode === "error" ? (
            <div className={styles.errCard}>
              <div className={styles.lbl}>$ scan failed</div>
              <div className={styles.errMsg}>
                Couldn&apos;t complete a real scan of <b>{target}</b>.
              </div>
              <div className={styles.errWhy}>{errorMsg}</div>
              <button type="button" className="btn" onClick={resetToIdle} data-cursor="./retry">
                try another domain <span className="arr">→</span>
              </button>
            </div>
          ) : mode === "scanning" ? (
            <div className={styles.live}>
              <div className={styles.lbl}>$ scanning {target}</div>
              <ScanStepper steps={steps} />
            </div>
          ) : (
            <form className={styles.form} onSubmit={onScan}>
              <div className={styles.lbl}>$ run a free scan</div>
              <input name="domain" required placeholder="yourbrand.com" autoComplete="url" data-cursor="./type" />
              <input name="email" type="email" required placeholder="you@brand.com" autoComplete="email" data-cursor="./type" />
              <input name="competitor" placeholder="a competitor (optional)" autoComplete="off" data-cursor="./type" />
              <input type="text" name="botcheck" className={styles.honeypot} tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <button type="submit" className="btn" data-cursor="./scan">
                run my free scan <span className="arr">→</span>
              </button>
              <div className={styles.disclaimer}>
                Live, real result: a technical-<b>hygiene</b> scan of your live page — structured data,
                crawl welcome mat, head tags &amp; Core Web Vitals proxies. Hygiene is table stakes,{" "}
                <b>not</b> a citation guarantee. The full multi-engine citation audit (ChatGPT · Claude ·
                Gemini · Perplexity · AI Overviews) plus SEO &amp; accessibility ships with a paid Scout audit.
              </div>
              <ul className={styles.checks}>
                <li>structured data / JSON-LD entities</li>
                <li>robots.txt + llms.txt crawl welcome mat</li>
                <li>title · meta · canonical · OpenGraph</li>
                <li>Core Web Vitals proxies</li>
              </ul>
            </form>
          )}
          <div className={styles.statusRow}>
            <span className={styles.statusKey}>visibility status</span>
            <span className={clsx(styles.pill, PILL[statusPill])}>{statusText}</span>
          </div>
          <div className={styles.scanId}>scan id · GBL-{(pct * 73 + 1031).toString(16).toUpperCase()}</div>
        </div>
      </div>
    </Panel>
  );
};
