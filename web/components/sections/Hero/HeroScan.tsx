"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import clsx from "clsx";
import { GoblinHead } from "@/components/ui/GoblinHead";
import { captureEvent } from "@/lib/analytics";
import { runHygieneScan, type ScanReport } from "@/lib/scan-api";
import { isValidDomain } from "@/lib/validate";
import { SCAN_PHASES } from "@/components/sections/LiveScan/scan.data";
import { phaseTone, phaseValues, scanFailureCopy, scanHost, scoreBand } from "@/components/sections/LiveScan/scan-report";
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
// Logo -> square-particle dissolve. Raw <canvas> + one rAF loop, no deps.
// The goblin SVG is sampled once into a grid of green squares that: dissolve in
// place, fly OUT to the right, fly back IN from the right (smaller), then PIN to
// the top-right corner. rAF stops at the end and a crisp static mini-logo takes
// over, so steady-state cost is zero. prefers-reduced-motion skips it entirely.
// ---------------------------------------------------------------------------
type Particle = {
  ox: number; oy: number; // origin (logo silhouette position, logical px)
  x: number; y: number; // current
  sx: number; sy: number; // phase source
  tx: number; ty: number; // phase target
  baseSize: number; size: number;
  alpha: number; delay: number;
  color: string;
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeInQuart = (t: number) => t * t * t * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

type PhaseName = "DISSOLVE" | "EXIT" | "ENTER" | "PIN";
const PHASES: { name: PhaseName; dur: number; ease: (t: number) => number; wave: number }[] = [
  { name: "DISSOLVE", dur: 520, ease: easeInOutCubic, wave: 180 },
  { name: "EXIT", dur: 620, ease: easeInQuart, wave: 160 },
  { name: "ENTER", dur: 560, ease: easeOutCubic, wave: 160 },
  { name: "PIN", dur: 420, ease: easeOutBack, wave: 120 },
];

const LIME = "#a3e635";
const RATIO = 360.6 / 502.3; // goblin head aspect (h/w)
const PIN_SCALE = 0.32;

export const HeroScan = () => {
  const [mode, setMode] = useState<HeroScanMode>("idle");
  const [target, setTarget] = useState("");
  const [pct, setPct] = useState(0);
  const [lines, setLines] = useState<HeroLine[]>([]);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [softError, setSoftError] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [logoPinned, setLogoPinned] = useState(false);
  const [scanSeq, setScanSeq] = useState(0);

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

    const setTargets = (phase: PhaseName, wave: number) => {
      for (const p of partsRef.current) {
        p.sx = p.x;
        p.sy = p.y;
        if (phase === "DISSOLVE") {
          p.tx = p.ox + (Math.random() - 0.5) * 10;
          p.ty = p.oy + (Math.random() - 0.5) * 10;
          p.delay = (p.ox / W) * wave + Math.random() * 40;
        } else if (phase === "EXIT") {
          p.tx = p.ox + W + 60 + Math.random() * 80;
          p.ty = p.oy - 24 + Math.random() * 48;
          p.delay = (p.ox / W) * wave + Math.random() * 40;
        } else if (phase === "ENTER") {
          p.sx = W + 50 + Math.random() * 90;
          p.sy = pinY + Math.random() * (logoH * PIN_SCALE);
          p.x = p.sx;
          p.y = p.sy;
          p.size = p.baseSize * PIN_SCALE;
          p.tx = pinX + (p.ox - logoLeft) * PIN_SCALE;
          p.ty = pinY + (p.oy - logoTop) * PIN_SCALE;
          p.delay = (1 - p.ox / W) * wave + Math.random() * 40;
        } else {
          p.tx = pinX + (p.ox - logoLeft) * PIN_SCALE;
          p.ty = pinY + (p.oy - logoTop) * PIN_SCALE;
          p.size = p.baseSize * PIN_SCALE;
          p.delay = (1 - p.ox / W) * wave;
        }
      }
    };

    let phaseIdx = 0;
    let phaseStart = 0;
    let pausedElapsed = 0;

    const begin = (idx: number) => {
      phaseIdx = idx;
      setTargets(PHASES[idx].name, PHASES[idx].wave);
      phaseStart = performance.now();
    };

    const tick = (now: number) => {
      if (!alive) return;
      const ph = PHASES[phaseIdx];
      const elapsed = now - phaseStart;
      ctx.clearRect(0, 0, W, H);
      for (const p of partsRef.current) {
        const span = Math.max(1, ph.dur - p.delay);
        const pt = Math.min(1, Math.max(0, (elapsed - p.delay) / span));
        const e = ph.ease(pt);
        p.x = p.sx + (p.tx - p.sx) * e;
        p.y = p.sy + (p.ty - p.sy) * e;
        let a = p.alpha;
        if (ph.name === "EXIT") a = p.alpha * (1 - e);
        else if (ph.name === "ENTER") a = p.alpha * e;
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1;
      if (elapsed >= ph.dur) {
        if (phaseIdx < PHASES.length - 1) {
          begin(phaseIdx + 1);
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
            ox, oy, x: ox, y: oy, sx: ox, sy: oy, tx: ox, ty: oy,
            baseSize, size: baseSize,
            alpha: Math.min(1, (data[i + 3] / 255) * (0.85 + Math.random() * 0.3)),
            delay: 0,
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
    setErrorMsg("");
    setSoftError(false);
    setFormErr("");
    setLines([]);
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
    setErrorMsg("");
    setSoftError(false);
    setPct(9);
    setLines([mkLine("cmd", `goblin scan --domain ${host}`), mkLine("info", "fetching public surface")]);
    captureEvent("hero_scan_started", { scan_id: scanId, domain: host });

    const scanPromise = runHygieneScan(domain);
    for (let i = 0; i < SCAN_PHASES.length; i += 1) {
      if (!alive()) return;
      setPct(Math.min(82, 18 + i * 14));
      setLines((prev) => [...prev, mkLine("info", `${SCAN_PHASES[i].label} ...`)]);
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
      return;
    }

    const measured = phaseValues(response.report);
    for (const phase of SCAN_PHASES) {
      if (!alive()) return;
      const tone = phaseTone(response.report, phase.key);
      setLines((prev) => [...prev, mkLine(tone === "bad" ? "bad" : tone === "warn" ? "warn" : "ok", `${phase.label}: ${measured[phase.key]}`)]);
      await sleep(110);
    }

    setPct(100);
    setReport(response.report);
    setMode("results");
    setLines((prev) => [...prev, mkLine("ok", response.summary || "scan complete")]);
    captureEvent("hero_scan_result_shown", {
      scan_id: scanId,
      domain: host,
      hygiene_score: response.report.hygieneScore,
      findings: response.report.findings?.length ?? 0,
    });
  };

  const band = report ? scoreBand(report.hygieneScore) : null;
  const findings = report?.findings ?? [];
  const shownFindings = findings.slice(0, 3);
  const scanning = mode !== "idle";
  const canvasActive = scanning && !logoPinned;

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
          <div className={styles.heroScore}>
            <span>{report.hygieneScore ?? "?"}</span>
            <small>/100</small>
          </div>
          <div>
            <div className={styles.heroResultTitle}>{band.label} hygiene surface</div>
            <div className={styles.heroResultMeta}>{findings.length} measured finding{findings.length === 1 ? "" : "s"}</div>
          </div>
          {shownFindings.length ? (
            <ul className={styles.heroFindings}>
              {shownFindings.map((finding, i) => (
                <li key={`${finding.detail || "finding"}-${i}`}>{finding.detail}</li>
              ))}
            </ul>
          ) : null}
          <a className="btn ghost" href="#contact" data-cursor="./email">
            email me the scan <span className="arr">-&gt;</span>
          </a>
        </div>
      ) : null}

      {mode === "error" ? (
        <div className={styles.heroScanError} data-soft={softError || undefined} role="alert">
          {errorMsg}
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
