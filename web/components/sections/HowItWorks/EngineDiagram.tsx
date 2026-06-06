"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ENGINE_PHASES, ENGINE_STAGES } from "./engine.data";
import styles from "./HowItWorks.module.css";

const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const LockIcon = () => (
  <svg className={styles.lock} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
    <rect x="5" y="11" width="14" height="9" rx="1.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/** The animated engine: a fix packet travels diagnose → eval gate → engineer. */
export const EngineDiagram = () => {
  const [phase, setPhase] = useState(0);
  const [reduced, setReduced] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const packetRef = useRef<HTMLDivElement>(null);

  // Advance phases only once the diagram is in view (loops).
  useEffect(() => {
    if (prefersReduced()) {
      // Post-hydration reduced-motion guard (see Loader): effect, not lazy init,
      // so static-export HTML and the client agree. Jump straight to the end state.
      /* eslint-disable react-hooks/set-state-in-effect */
      setReduced(true);
      setPhase(ENGINE_PHASES.length - 1);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        let i = 0;
        const tick = () => {
          if (!alive) return;
          setPhase(i % ENGINE_PHASES.length);
          i += 1;
          timer = setTimeout(tick, i % ENGINE_PHASES.length === 0 ? 1700 : 1500);
        };
        timer = setTimeout(tick, 600);
      },
      { threshold: 0.35 },
    );
    if (wrapRef.current) io.observe(wrapRef.current);
    return () => {
      alive = false;
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);

  // Slide the packet over the active stage.
  const place = useCallback(() => {
    const wrap = wrapRef.current;
    const packet = packetRef.current;
    const target = stageRefs.current[ENGINE_PHASES[phase].stage];
    if (!wrap || !packet || !target) return;
    const w = wrap.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const x = t.left - w.left + t.width / 2 - packet.offsetWidth / 2;
    const y = t.top - w.top - packet.offsetHeight - 6;
    packet.style.transform = `translate(${Math.max(2, x)}px, ${Math.max(2, y)}px)`;
  }, [phase]);

  useEffect(() => {
    place();
    const onResize = () => place();
    window.addEventListener("resize", onResize);
    const t = setTimeout(place, 120);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, [place]);

  const ph = ENGINE_PHASES[phase];

  return (
    <div className={styles.engine} ref={wrapRef}>
      <div className={styles.engineBar}>
        <span className={styles.lhs}>
          <span className={styles.lights}>
            <i className={styles.lightOn} />
            <i className={styles.lightOn} />
            <i />
          </span>
          goblin-engine · self-healing · eval-gated
        </span>
        <span className={styles.sampleTag}>sample run</span>
      </div>

      <div className={styles.stageWrap}>
        <div className={styles.stages}>
          {ENGINE_STAGES.map((stage, i) => {
            const isGate = i === 1;
            const active = ph.stage === i;
            const gateState = isGate ? ph.gate : null;
            return (
              <Fragment key={stage.num}>
                <div
                  ref={(el) => {
                    stageRefs.current[i] = el;
                  }}
                  className={clsx(
                    styles.stage,
                    active && styles.stageActive,
                    gateState === "fail" && styles.stageFail,
                  )}
                >
                  <div className={styles.stageNum}>{stage.num}</div>
                  <div className={styles.stageName}>{stage.name}</div>
                  <div className={styles.stageDesc}>{stage.desc}</div>
                  {isGate && gateState === "pass" && (
                    <span className={clsx(styles.badge, styles.badgePass)}>● eval PASS</span>
                  )}
                  {isGate && gateState === "fail" && (
                    <span className={clsx(styles.badge, styles.badgeFail)}>● eval RED</span>
                  )}
                  {isGate && (gateState === "eval" || gateState === null) && (
                    <span className={styles.badge}>○ idle</span>
                  )}
                  {i === 2 && (
                    <span className={styles.badge}>
                      <LockIcon /> engineer-gated
                    </span>
                  )}
                </div>
                {i < 2 && (
                  <div className={styles.conn}>
                    <svg className={styles.connH} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12h15M14 7l5 5-5 5" />
                    </svg>
                    <svg className={styles.connV} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 4v15M7 14l5 5 5-5" />
                    </svg>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
        {!reduced && (
          <div ref={packetRef} className={clsx(styles.packet, ph.pkFail && styles.packetFail)}>
            <span className={styles.pkDot} />
            {ph.pk}
          </div>
        )}
      </div>

      <div className={styles.readout}>
        <span className={clsx(styles.tick, ph.tick === "bad" && styles.tickBad)}>
          {ph.tick === "bad" ? "⚠" : "▸"}
        </span>
        <span>{ph.rd}</span>
      </div>
      <div className={styles.legend}>
        <span>
          <i className={styles.legendActive} />
          active path
        </span>
        <span>
          <i className={styles.legendFail} />
          failed gate → self-heal
        </span>
        <span>
          <i className={styles.legendHuman} />
          engineer review gate
        </span>
      </div>
      <p className={styles.rmNote}>
        ▸ One pipeline: <b>diagnose → eval gate → engineer approve</b>. A failed gate bounces the fix
        back to the self-healing loop; nothing ships until a software engineer approves. SEO +
        accessibility proven on the gate (2026-06-02); schema scaffolded.
      </p>
    </div>
  );
};
