"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import clsx from "clsx";
import { GoblinHead } from "@/components/ui/GoblinHead";
import { captureEvent } from "@/lib/analytics";
import { runHygieneScan, runCitationTeaserAuto, type ScanReport, type CitationTeaserData, type RenderDiff } from "@/lib/scan-api";
import { isValidDomain } from "@/lib/validate";
import { SCAN_PHASES, type ScanStep } from "@/components/sections/LiveScan/scan.data";
import { phaseTone, phaseValues, scanFailureCopy, scanHost, scoreBand } from "@/components/sections/LiveScan/scan-report";
import { TechIcon } from "@/components/sections/LiveScan/TechIcon";
import styles from "./Hero.module.css";

type HeroScanMode = "idle" | "scanning" | "results" | "error";

type HeroLine = {
  id: number;
  tone: "cmd" | "info" | "ok" | "warn" | "bad";
  text: string;
};

let lineUid = 0;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const mkLine = (tone: HeroLine["tone"], text: string): HeroLine => ({ id: lineUid++, tone, text });

// ---------------------------------------------------------------------------
// Logo -> particle-LINE dissolve (ported from logo-flycycle.html). Raw <canvas>
// + one rAF loop, no deps. The goblin SVG is sampled once into a grid of green
// dots that: granulate off the solid logo, then STREAK off the right edge as
// horizontal lines (each dot stretches with its velocity), fly back IN from the
// right at a smaller scale (the line collapses back to a dot), and PIN to the
// top-right corner where a crisp static mini-logo takes over. A twinkle shimmer
// rides the alpha. rAF stops at the end (zero steady-state cost);
// prefers-reduced-motion skips the whole thing and jumps straight to the pin.
// ---------------------------------------------------------------------------
type Particle = {
  ox: number; oy: number; // origin (logo silhouette position, logical px)
  baseSize: number; // dot side length
  alpha: number; // sampled opacity
  rank: number; // 0..1 stagger order (comet trail)
  twk: number; // twinkle phase offset
  color: string;
};

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type PhaseName = "DISSOLVE" | "EXIT" | "ENTER" | "PIN";
const PHASES: { name: PhaseName; dur: number; wave: number; alphaEase: (t: number) => number }[] = [
  { name: "DISSOLVE", dur: 460, wave: 120, alphaEase: easeOutCubic },
  { name: "EXIT", dur: 700, wave: 240, alphaEase: easeOutCubic },
  { name: "ENTER", dur: 650, wave: 220, alphaEase: easeOutCubic },
  { name: "PIN", dur: 360, wave: 0, alphaEase: easeInOutCubic },
];

const LIME = "#a3e635";
const RATIO = 360.6 / 502.3; // goblin head aspect (h/w)
const PIN_SCALE = 0.32;
const STREAK = 6; // velocity -> horizontal line stretch (matches the flycycle ref)

export const HeroScan = () => {
  const [mode, setMode] = useState<HeroScanMode>("idle");
  const [target, setTarget] = useState("");
  const [pct, setPct] = useState(0);
  const [lines, setLines] = useState<HeroLine[]>([]);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [renderDiff, setRenderDiff] = useState<RenderDiff | null>(null);
  const [teaser, setTeaser] = useState<CitationTeaserData | null>(null);
  const [teaserLoading, setTeaserLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [softError, setSoftError] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [logoPinned, setLogoPinned] = useState(false);
  const [scanSeq, setScanSeq] = useState(0);
  const [steps, setSteps] = useState<ScanStep[]>([]);

  const runRef = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const partsRef = useRef<Particle[]>([]);

  // The particle animation. Keyed on scanSeq so it fires exactly once per submit
  // and runs to completion regardless of the mode transitions during the scan.
  // useEffect is client-only and nothing in render touches browser APIs, so the
  // <canvas> is safe under static export without a mounted gate.
  useEffect(() => {
    if (scanSeq === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const svg = svgRef.current;
    const cv = canvasRef.current;
    const ctx = cv?.getContext("2d", { alpha: true }) ?? null;
    const rect = cv?.getBoundingClientRect();

    // Reduced motion / no canvas / unmeasured box -> jump to the pinned mini-logo.
    if (reduce || !svg || !cv || !ctx || !rect || rect.width < 2 || rect.height < 2) {
      setLogoPinned(true);
      return;
    }

    let alive = true;
    setLogoPinned(false);

    const W = rect.width;
    const H = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.width = `${W}px`;
    cv.style.height = `${H}px`;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = false;

    const isMobile = window.matchMedia("(max-width: 560px)").matches || navigator.maxTouchPoints > 1;
    const STEP = isMobile ? 6 : 4;

    const logoW = Math.min(W * 0.68, 330);
    const logoH = logoW * RATIO;
    const logoLeft = (W - logoW) / 2;
    const logoTop = (H - logoH) / 2;
    const pinW = logoW * PIN_SCALE;
    const pinX = W - pinW - 8;
    const pinY = 6;
    const D = W + logoW; // streak distance: clears the panel's right edge

    let phaseIdx = 0;
    let phaseStart = 0;
    let pausedElapsed = 0;

    const begin = (idx: number) => {
      phaseIdx = idx;
      phaseStart = performance.now();
    };

    const tick = (now: number) => {
      if (!alive) return;
      const ph = PHASES[phaseIdx];
      const elapsed = now - phaseStart;
      const sec = now / 1000;
      ctx.clearRect(0, 0, W, H);

      // Global dot opacity: crossfade logo->dots on DISSOLVE, dots->pinned on PIN.
      const phaseProg = Math.min(1, elapsed / ph.dur);
      const dotsA =
        ph.name === "DISSOLVE"
          ? ph.alphaEase(phaseProg)
          : ph.name === "PIN"
            ? 1 - ph.alphaEase(phaseProg)
            : 1;

      for (const p of partsRef.current) {
        const stagger = ph.name === "EXIT" || ph.name === "ENTER" ? p.rank * ph.wave : 0;
        const span = Math.max(1, ph.dur - stagger);
        const pt = Math.min(1, Math.max(0, (elapsed - stagger) / span));

        let x: number;
        let y: number;
        let size: number;
        let streak: number; // 0 = dot, 1 = fully stretched line
        if (ph.name === "EXIT") {
          // accelerate off the right edge; the dot stretches into a line as it speeds up
          x = p.ox + pt * pt * D;
          y = p.oy;
          size = p.baseSize;
          streak = pt;
        } else if (ph.name === "ENTER") {
          // mirror of EXIT: decelerate in from just off the right edge at PIN scale,
          // the line collapses back to a dot. The pin target sits near the right edge,
          // so the return starts just off-screen (NOT a full panel away) — otherwise the
          // dots spend most of ENTER off-canvas and the panel reads empty mid-flight.
          const ease = 1 - (1 - pt) * (1 - pt);
          size = p.baseSize * PIN_SCALE;
          const tx = pinX + (p.ox - logoLeft) * PIN_SCALE;
          const startX = W + W * 0.16; // just past the right edge -> visible return streak
          x = tx + (1 - ease) * (startX - tx);
          y = pinY + (p.oy - logoTop) * PIN_SCALE;
          streak = 1 - pt;
        } else if (ph.name === "PIN") {
          x = pinX + (p.ox - logoLeft) * PIN_SCALE;
          y = pinY + (p.oy - logoTop) * PIN_SCALE;
          size = p.baseSize * PIN_SCALE;
          streak = 0;
        } else {
          // DISSOLVE — dots rest on the logo silhouette and fade up
          x = p.ox;
          y = p.oy;
          size = p.baseSize;
          streak = 0;
        }

        const twinkle = 0.5 + 0.3 * Math.sin(sec * 2 + p.twk) + 0.2 * Math.sin(sec * 5.3 + p.twk * 1.7);
        const a = dotsA * p.alpha * Math.max(0, Math.min(1, 0.35 + 0.65 * twinkle));
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        const w = size * (1 + streak * STREAK);
        ctx.fillRect(x - w / 2, y - size / 2, w, size);
      }
      ctx.globalAlpha = 1;

      if (elapsed >= ph.dur) {
        if (phaseIdx < PHASES.length - 1) {
          const next = phaseIdx + 1;
          if (PHASES[next].name === "PIN") setLogoPinned(true); // crossfade the static mark in
          begin(next);
        } else {
          alive = false;
          cancelAnimationFrame(rafRef.current);
          setLogoPinned(true);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const pause = () => {
      if (alive) pausedElapsed = performance.now() - phaseStart;
      cancelAnimationFrame(rafRef.current);
    };
    const resume = () => {
      if (!alive || document.hidden) return;
      cancelAnimationFrame(rafRef.current);
      phaseStart = performance.now() - pausedElapsed;
      rafRef.current = requestAnimationFrame(tick);
    };

    const sample = async (): Promise<Particle[]> => {
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.style.fill = LIME; // root currentColor would otherwise freeze to black
      clone.querySelectorAll('[fill="currentColor"],[stroke="currentColor"]').forEach((el) => {
        el.setAttribute("fill", LIME);
      });
      const SW = 240;
      const SH = Math.round(SW * RATIO);
      clone.setAttribute("width", String(SW));
      clone.setAttribute("height", String(SH));
      const svgStr = new XMLSerializer().serializeToString(clone);
      const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
      const img = new Image();
      img.decoding = "async";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("svg sample failed"));
        img.src = url;
      });
      const off = document.createElement("canvas");
      off.width = SW;
      off.height = SH;
      const octx = off.getContext("2d");
      if (!octx) return [];
      octx.drawImage(img, 0, 0, SW, SH);
      const { data } = octx.getImageData(0, 0, SW, SH);
      const scale = logoW / SW;
      const out: Particle[] = [];
      for (let y = 0; y < SH; y += STEP) {
        for (let x = 0; x < SW; x += STEP) {
          const i = (y * SW + x) * 4;
          if (data[i + 3] <= 90) continue;
          const ox = logoLeft + x * scale;
          const oy = logoTop + y * scale;
          const baseSize = 2 + Math.random() * 2;
          out.push({
            ox,
            oy,
            baseSize,
            alpha: Math.min(1, (data[i + 3] / 255) * (0.85 + Math.random() * 0.3)),
            rank: Math.random(),
            twk: Math.random() * Math.PI * 2,
            color: LIME,
          });
        }
      }
      if (out.length > 1200) {
        const k = Math.ceil(out.length / 1200);
        return out.filter((_, n) => n % k === 0);
      }
      return out;
    };

    sample()
      .then((parts) => {
        if (!alive) return;
        partsRef.current = parts;
        begin(0);
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (alive) setLogoPinned(true);
      });

    const onVis = () => (document.hidden ? pause() : resume());
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? resume() : pause()),
      { threshold: 0 },
    );
    io.observe(cv);

    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [scanSeq]);

  const reset = () => {
    runRef.current += 1;
    cancelAnimationFrame(rafRef.current);
    setMode("idle");
    setLogoPinned(false);
    setScanSeq(0);
    setTarget("");
    setPct(0);
    setReport(null);
    setRenderDiff(null);
    setTeaser(null);
    setTeaserLoading(false);
    setErrorMsg("");
    setSoftError(false);
    setFormErr("");
    setLines([]);
    setSteps([]);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    if (data.botcheck) return;

    const domain = (data.domain || "").trim();
    if (!isValidDomain(domain)) {
      setFormErr("Enter a valid domain, e.g. yourbrand.com.");
      return;
    }

    const host = scanHost(domain);
    const run = ++runRef.current;
    const alive = () => runRef.current === run;
    const scanId = `hero_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

    setFormErr("");
    setTarget(host);
    setMode("scanning");
    setLogoPinned(false);
    setScanSeq((s) => s + 1); // trigger the logo dissolve
    setReport(null);
    setRenderDiff(null);
    setTeaser(null);
    setTeaserLoading(true);
    setErrorMsg("");
    setSoftError(false);
    setPct(9);
    setLines([mkLine("cmd", `goblin scan --domain ${host}`), mkLine("info", "fetching public surface")]);
    setSteps(SCAN_PHASES.map((p) => ({ key: p.key, label: p.label, status: "pending", value: null, tone: "ok" })));
    captureEvent("hero_scan_started", { scan_id: scanId, domain: host });

    // Fire both tiers in parallel — Tier 2 is independent of Tier 1 results.
    const scanPromise = runHygieneScan(domain);
    const teaserPromise = runCitationTeaserAuto(host);
    for (let i = 0; i < SCAN_PHASES.length; i += 1) {
      if (!alive()) return;
      setPct(Math.min(82, 18 + i * 14));
      setLines((prev) => [...prev, mkLine("info", `${SCAN_PHASES[i].label} ...`)]);
      setSteps((prev) => prev.map((s, idx) => (idx <= i ? { ...s, status: "active" } : s)));
      await sleep(360 + Math.random() * 160);
    }

    let response = null;
    try {
      response = await scanPromise;
    } catch {
      response = null;
    }
    if (!alive()) return;

    if (!response?.ok || !response.report) {
      // A blocked / unreachable / private host is NOT a hygiene failure — never
      // score it 0. Surface the honest, integrity-approved reason instead.
      const fail = scanFailureCopy(response);
      setPct(100);
      setMode("error");
      setSoftError(fail.soft);
      setErrorMsg(fail.card);
      setLines((prev) => [...prev, mkLine(fail.soft ? "warn" : "bad", fail.line)]);
      captureEvent("hero_scan_failed", { scan_id: scanId, domain: host, reason: fail.outcome ?? "unknown" });

      // Tier 2 never fetches the site — it asks the answer engines about the
      // brand. A WAF-walled retail/enterprise site (the kind that blocks our
      // Tier-1 fetch) still has a measurable AI-visibility surface, and it's the
      // most compelling thing we can show here. So surface it instead of
      // dropping it on the blocked path.
      const teaserResult = await teaserPromise.catch(() => null);
      if (!alive()) return;
      setTeaserLoading(false);
      if (teaserResult?.ok && teaserResult.teaserMode && teaserResult.teaser) {
        setTeaser(teaserResult.teaser);
        captureEvent("hero_teaser_shown_on_block", {
          scan_id: scanId,
          domain: host,
          client_cited: teaserResult.teaser.clientCited ? 1 : 0,
          cited_domains: teaserResult.teaser.citedDomains?.length ?? 0,
        });
      }
      return;
    }

    const measured = phaseValues(response.report);
    for (let j = 0; j < SCAN_PHASES.length; j += 1) {
      if (!alive()) return;
      const phase = SCAN_PHASES[j];
      const tone = phaseTone(response.report, phase.key);
      setLines((prev) => [...prev, mkLine(tone === "bad" ? "bad" : tone === "warn" ? "warn" : "ok", `${phase.label}: ${measured[phase.key]}`)]);
      setSteps((prev) => prev.map((s, idx) => (idx === j ? { ...s, status: "done", value: measured[phase.key], tone } : s)));
      await sleep(110);
    }

    setPct(100);
    setReport(response.report);
    if (response.renderDiff?.available) setRenderDiff(response.renderDiff);
    setMode("results");
    setLines((prev) => [...prev, mkLine("ok", response.summary || "scan complete")]);
    captureEvent("hero_scan_result_shown", {
      scan_id: scanId,
      domain: host,
      hygiene_score: response.report.hygieneScore,
      findings: response.report.findings?.length ?? 0,
    });

    // Await Tier 2 teaser (already in-flight since submit; may resolve immediately).
    const teaserResult = await teaserPromise.catch(() => null);
    if (!alive()) return;
    setTeaserLoading(false);
    if (teaserResult?.ok && teaserResult.teaserMode && teaserResult.teaser) {
      setTeaser(teaserResult.teaser);
    }
  };

  const band = report ? scoreBand(report.hygieneScore) : null;
  const findings = report?.findings ?? [];
  const shownFindings = findings.slice(0, 3);
  const detectedStack = (report?.techStack?.detected ?? []).filter((t) => t.name);
  const scanning = mode !== "idle";
  const canvasActive = scanning;

  // AI-visibility teaser (Tier 2). Rendered in BOTH the results and the
  // blocked-error states — Tier 2 doesn't fetch the site, so a WAF-walled
  // hygiene scan can still carry a real citation result worth showing.
  const citationPanel = (teaserLoading || teaser) ? (
    <div className={styles.heroCitationTeaser} aria-live="polite">
      <div className={styles.heroCitationTeaserLabel}>
        <span>AI visibility</span>
        <span className={styles.heroCitationTeaserEngine}>· perplexity · live</span>
      </div>
      {teaserLoading && !teaser ? (
        <span className={styles.heroCitationLoading}>checking AI visibility…</span>
      ) : teaser ? (
        <>
          <div className={styles.heroCitationRow}>
            <span>you:</span>
            <span className={teaser.clientCited ? styles.heroCitationCited : styles.heroCitationMissed}>
              {teaser.clientCited ? "✓ cited" : "✗ not cited yet"}
            </span>
          </div>
          {teaser.citedDomains && teaser.citedDomains.length > 0 ? (
            <div className={styles.heroCitationRow}>
              <span>cited instead:</span>
              <span>{teaser.citedDomains.join(", ")}</span>
            </div>
          ) : null}
          <div className={styles.heroCitationNote}>
            {`${teaser.queriesRun ?? 1} ${(teaser.queriesRun ?? 1) === 1 ? "query" : "queries"} checked · `}
            {teaser.clientCited
              ? "full Scout report: 50 prompts × 4 engines"
              : "not cited yet — that's the opening (a measurable gap we close, not a guaranteed outcome) · full Scout: 50 prompts × 4 engines"}
          </div>
        </>
      ) : null}
    </div>
  ) : null;

  return (
    <div className={styles.scanShell} data-mode={mode} data-pinned={logoPinned}>
      <div className={styles.scanLogoStage} aria-hidden="true">
        <GoblinHead ref={svgRef} className={clsx(styles.scanLogo, scanning && styles.scanLogoOut)} />
        <canvas ref={canvasRef} className={clsx(styles.scanCanvas, canvasActive && styles.scanCanvasActive)} />
        <GoblinHead className={clsx(styles.scanLogoPinned, logoPinned && styles.scanLogoPinnedIn)} />
      </div>

      <div className={styles.scanHud}>
        <span className={styles.scanHudName}>{mode === "idle" ? "free live scan" : target || "scanning"}</span>
        <span>{String(pct).padStart(3, "0")}%</span>
      </div>

      <form className={clsx(styles.heroScanForm, scanning && styles.heroScanFormGone)} onSubmit={onSubmit}>
        <label className={styles.heroScanLabel} htmlFor="hero-domain">
          domain
        </label>
        <div className={styles.heroScanLine}>
          <input
            id="hero-domain"
            name="domain"
            required
            placeholder="yourbrand.com"
            autoComplete="url"
            disabled={mode === "scanning"}
            data-cursor="./type"
          />
          <button type="submit" disabled={mode === "scanning"} data-cursor="./scan">
            {mode === "scanning" ? "scanning" : "scan"} <span className="arr">-&gt;</span>
          </button>
        </div>
        <input type="text" name="botcheck" className={styles.honeypot} tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {formErr ? (
          <div className={styles.heroScanError} role="alert">
            {formErr}
          </div>
        ) : null}
      </form>

      <div className={styles.heroTerminal}>
        {lines.map((line) => (
          <div className={clsx(styles.heroLine, styles[`line${line.tone[0].toUpperCase()}${line.tone.slice(1)}`])} key={line.id}>
            {line.text}
          </div>
        ))}
      </div>

      {mode === "results" && report && band ? (
        <div className={styles.heroResult}>
          <div
            className={clsx(
              styles.heroScore,
              band.key === "bad" && styles.heroScoreBad,
              band.key === "warn" && styles.heroScoreWarn,
            )}
          >
            <span>{report.hygieneScore ?? "?"}</span>
            <small>/100</small>
          </div>
          <div>
            <div className={styles.heroResultTitle}>{band.label} hygiene surface</div>
            <div className={styles.heroResultMeta}>{findings.length} measured finding{findings.length === 1 ? "" : "s"}</div>
          </div>
          {steps.length ? (
            <ol className={styles.heroStepper} aria-label="scan checks">
              {steps.map((step) => (
                <li className={clsx(styles.heroStep, step.status === "done" && styles.heroStepDone)} key={step.key}>
                  <span className={styles.heroStepDot} aria-hidden="true">
                    {step.status === "done" ? "✓" : "›"}
                  </span>
                  <span className={styles.heroStepLabel}>{step.label}</span>
                  {step.value ? (
                    <span
                      className={clsx(
                        styles.heroStepVal,
                        step.tone === "bad" ? styles.lineBad : step.tone === "warn" ? styles.lineWarn : styles.lineOk,
                      )}
                    >
                      {step.value}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}
          {detectedStack.length ? (
            <div className={styles.heroStack}>
              <div className={styles.heroStackLabel}>detected stack</div>
              <div className={styles.heroStackChips}>
                {detectedStack.map((tech, i) => (
                  <span className={styles.heroStackChip} key={`${tech.name}-${i}`}>
                    <TechIcon name={tech.name} className={styles.heroTechIcon} />
                    {tech.name}
                    {tech.confidence ? <span className={styles.heroStackConf}> · {tech.confidence}</span> : null}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {shownFindings.length ? (
            <ul className={styles.heroFindings}>
              {shownFindings.map((finding, i) => (
                <li key={`${finding.detail || "finding"}-${i}`}>{finding.detail}</li>
              ))}
            </ul>
          ) : null}
          {renderDiff?.available && (renderDiff.hiddenSchemaCount ?? 0) > 0 ? (
            <div className={styles.heroRenderDiff} aria-label="browser vs. crawler diff">
              <div className={styles.heroRenderDiffLabel}>
                <span>browser vs. crawler</span>
                {renderDiff.isSpa ? <span className={styles.heroRenderDiffTag}>js-rendered</span> : null}
              </div>
              <div className={styles.heroRenderDiffRow}>
                <span>hidden from crawlers:</span>
                <span className={styles.heroRenderDiffBad}>{renderDiff.hiddenSchemaCount} schema{(renderDiff.hiddenSchemaCount ?? 0) === 1 ? "" : "s"}</span>
              </div>
              <div className={styles.heroRenderDiffTypes}>
                {(renderDiff.schemasOnlyInBrowser ?? []).join(", ")}
              </div>
              <div className={styles.heroRenderDiffNote}>
                {renderDiff.staticWasBlocked
                  ? "WAF blocked the static crawl — answer engines see none of your structured data"
                  : "these schema types are injected by JavaScript — answer-engine crawlers fetch static HTML and miss them"}
              </div>
            </div>
          ) : null}
          {citationPanel}
          <a className="btn ghost" href="#contact" data-cursor="./email">
            email me the scan <span className="arr">-&gt;</span>
          </a>
        </div>
      ) : null}

      {mode === "error" ? (
        <div className={styles.heroErrorBlock}>
          <div className={styles.heroScanError} data-soft={softError || undefined} role="alert">
            {errorMsg}
          </div>
          {citationPanel}
          {teaser ? (
            <a className="btn ghost" href="#contact" data-cursor="./email">
              email me the scan <span className="arr">-&gt;</span>
            </a>
          ) : null}
        </div>
      ) : null}

      {mode !== "idle" ? (
        <button type="button" className={styles.heroReset} onClick={reset} data-cursor="./retry">
          reset scan
        </button>
      ) : null}
    </div>
  );
};
