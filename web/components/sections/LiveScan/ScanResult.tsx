import clsx from "clsx";
import type { CSSProperties } from "react";
import type { ScanReport, TeaserResponse, TeaserAutoResponse } from "@/lib/scan-api";
import type { ScanStep } from "./scan.data";
import type { ScoreBand } from "./scan-report";
import { ScanStepper } from "./ScanStepper";
import { TechIcon } from "./TechIcon";
import styles from "./LiveScan.module.css";

const BAND: Record<string, string | undefined> = {
  ok: styles.bandOk,
  warn: styles.bandWarn,
  bad: styles.bandBad,
};

type ScanResultProps = {
  report: ScanReport;
  email: string;
  target: string;
  competitor: string;
  techStackInput: string;
  band: ScoreBand;
  steps: ScanStep[];
  tier2: Tier2State;
  onReset: () => void;
};

export type Tier2State =
  | { status: "idle" }
  | { status: "skipped" }
  | { status: "loading"; competitor?: string }
  | { status: "ready"; competitor: string; data: TeaserResponse }
  | { status: "ready-auto"; data: TeaserAutoResponse }
  | { status: "no-key"; competitor?: string; summary?: string }
  | { status: "rate-limited"; competitor?: string; retryAfterHours?: number; summary?: string }
  | { status: "error"; competitor?: string; message: string };

export const ScanResult = ({ report, email, target, competitor, techStackInput, band, steps, tier2, onReset }: ScanResultProps) => {
  const found = report.schema?.found ?? [];
  const missing = report.schema?.missing ?? [];
  const findings = report.findings ?? [];
  const highN = findings.filter((f) => (f.severity ?? 0) >= 4).length;
  const medN = findings.filter((f) => f.severity === 3).length;
  const lowN = findings.filter((f) => f.severity != null && f.severity <= 2).length;

  return (
    <div className={styles.result}>
      {steps?.length ? <ScanStepper steps={steps} /> : null}

      <div className={styles.srTop}>
        <div className={clsx(styles.srScore, BAND[band.key])}>
          <span className={styles.srNum}>{report.hygieneScore}</span>
          <span className={styles.srDen}>/100</span>
        </div>
        <div className={styles.srTopMeta}>
          <div className={styles.srK}>hygiene · {target}</div>
          <div className={styles.srSub}>
            {highN} high · {medN} medium · {lowN} low
          </div>
        </div>
      </div>

      <div className={styles.srBlock}>
        <div className={styles.srK}>structured data</div>
        <div className={styles.srChips}>
          {found.map((t) => (
            <span className={clsx(styles.srChip, styles.chipOk)} key={`f${t}`}>
              ✓ {t}
            </span>
          ))}
          {missing.map((t) => (
            <span className={clsx(styles.srChip, styles.chipMiss)} key={`m${t}`}>
              ✕ {t}
            </span>
          ))}
          {!found.length && !missing.length && <span className={styles.srChip}>—</span>}
        </div>
      </div>

      <TechStackCard report={report} entered={techStackInput} />

      <Tier2Card target={target} competitor={competitor} tier2={tier2} />

      <p className={styles.srDisc}>{report.disclaimer}</p>

      <div className={styles.srCta}>
        <div className={styles.srOkT}>
          ✓ Real hygiene result delivered above. A software engineer (me) will personally review it
          and email {email || "you"}{" "}
          about the full citation &amp; accessibility audit. No automated report.
        </div>
        <a className="btn" href="#pricing" data-cursor="./audit">
          see the full Scout audit <span className="arr">→</span>
        </a>
      </div>

      <button type="button" className={styles.srAgain} onClick={onReset} data-cursor="./retry">
        ↺ scan another domain
      </button>
    </div>
  );
};

export const Tier2Card = ({
  target,
  competitor,
  tier2,
}: {
  target: string;
  competitor: string;
  tier2: Tier2State;
}) => {
  if (tier2.status === "idle") return null;

  if (tier2.status === "skipped") {
    return (
      <div className={styles.tier2Card}>
        <div className={styles.srK}>tier 2 citation teaser</div>
        <p className={styles.tier2Muted}>
          The live competitor citation diff is part of a paid Scout — we surface the rivals we
          infer are your closest and check who the answer engines actually cite.
        </p>
      </div>
    );
  }

  if (tier2.status === "loading") {
    return (
      <div className={styles.tier2Card}>
        <div className={styles.tier2Head}>
          <div>
            <div className={styles.srK}>tier 2 citation teaser</div>
            <div className={styles.tier2Sub}>
              {tier2.competitor
                ? `Perplexity is checking ${target} vs ${tier2.competitor}`
                : `Perplexity is checking who cites ${target}`}
            </div>
          </div>
          <span className={styles.tier2Badge}>running</span>
        </div>
        <div className={styles.tier2Bars} aria-hidden="true">
          <i />
          <i />
        </div>
      </div>
    );
  }

  if (tier2.status === "no-key") {
    return <Tier2Notice label="not configured" text={tier2.summary || "Tier 2 key is not configured."} />;
  }

  if (tier2.status === "rate-limited") {
    return (
      <Tier2Notice
        label="rate limited"
        text={tier2.summary || `Try again in ${tier2.retryAfterHours ?? "a few"} hour(s).`}
      />
    );
  }

  if (tier2.status === "error") {
    return <Tier2Notice label="unavailable" text={tier2.message} />;
  }

  // --- Auto (domain-only) result ---
  if (tier2.status === "ready-auto") {
    const t = tier2.data.teaser;
    const engine = t?.engine || "perplexity";
    const citedDomains = t?.citedDomains ?? [];
    return (
      <div className={styles.tier2Card}>
        <div className={styles.tier2Head}>
          <div>
            <div className={styles.srK}>tier 2 citation teaser</div>
            <div className={styles.tier2Sub}>{engine} · live citation check for {target}</div>
          </div>
          <span className={styles.tier2Badge}>live</span>
        </div>
        {t?.clientCited ? (
          <p className={styles.tier2Summary}>
            <strong>{target}</strong> is cited in live answer-engine results — you have a foothold.
            The full Scout audit measures how often, on which queries, and how to widen the lead.
          </p>
        ) : (
          <p className={styles.tier2Summary}>
            <strong>{target}</strong> is not cited yet in these answer-engine results — that is the
            opening. Ranking well here is a measurable gap we close, not a guaranteed outcome.
          </p>
        )}
        {citedDomains.length > 0 && (
          <div className={styles.srBlock}>
            <div className={styles.srK}>who is getting cited instead</div>
            <div className={styles.srChips}>
              {citedDomains.map((d) => (
                <span className={clsx(styles.srChip, styles.chipMiss)} key={d}>{d}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Comparative result ---
  const results = tier2.data.teaser?.results ?? [];
  const clientWins = results.filter((r) => r.clientCited).length;
  const competitorWins = results.filter((r) => r.competitorCited).length;
  const engine = tier2.data.teaser?.engine || "perplexity";
  const total = Math.max(results.length, 1);

  return (
    <div className={styles.tier2Card}>
      <div className={styles.tier2Head}>
        <div>
          <div className={styles.srK}>tier 2 citation teaser</div>
          <div className={styles.tier2Sub}>
            {engine} · {target} vs {tier2.competitor}
          </div>
        </div>
        <span className={styles.tier2Badge}>live</span>
      </div>

      <div className={styles.tier2ScoreGrid}>
        <CitationBar label={target} value={clientWins} total={total} tone="client" />
        <CitationBar label={tier2.competitor} value={competitorWins} total={total} tone="competitor" />
      </div>

      <div className={styles.tier2Queries}>
        {results.map((r, i) => (
          <div className={styles.tier2Query} key={`${r.query || "query"}-${i}`}>
            <span className={styles.tier2Q}>{r.query || `query ${i + 1}`}</span>
            <span className={clsx(styles.tier2Dot, r.clientCited && styles.dotClient)} title={`${target} cited`} />
            <span className={clsx(styles.tier2Dot, r.competitorCited && styles.dotCompetitor)} title={`${tier2.competitor} cited`} />
            <span className={styles.tier2Sources}>{r.sources?.length ?? 0} sources</span>
          </div>
        ))}
      </div>

      {tier2.data.summary ? <p className={styles.tier2Summary}>{tier2.data.summary}</p> : null}
    </div>
  );
};

const TechStackCard = ({ report, entered }: { report: ScanReport; entered: string }) => {
  const detected = report.techStack?.detected ?? [];
  const primary = entered || detected[0]?.name || "";
  const hasChips = detected.length > 0 || Boolean(entered);

  return (
    <div className={styles.stackCard}>
      <div className={styles.stackHead}>
        <div>
          <div className={styles.srK}>implementation stack</div>
          <div className={styles.stackSub}>
            {primary ? `Fix plan can be mapped to ${primary}.` : "No stack confirmed yet."}
          </div>
        </div>
        <span className={styles.stackBadge}>{entered ? "entered" : detected.length ? "detected" : "needed"}</span>
      </div>

      {hasChips ? (
        <div className={styles.stackChips}>
          {detected.map((s, i) => (
            <span className={styles.stackChip} style={{ "--i": i } as CSSProperties} key={`${s.name}-${s.evidence}`}>
              <TechIcon name={s.name} className={styles.techIcon} />
              {s.name} · {s.confidence}
            </span>
          ))}
          {entered ? (
            <span className={styles.stackChip} style={{ "--i": detected.length } as CSSProperties} key="entered-stack">
              <TechIcon name={entered} className={styles.techIcon} />
              {entered}
            </span>
          ) : null}
        </div>
      ) : null}

      <p className={styles.stackText}>
        {report.techStack?.note ||
          "The free scan fingerprints your stack from public HTML. If it's hidden behind a CDN or custom build, we'll confirm it during your Scout audit so the repair plan targets the right files, CMS fields, or plugin settings."}
      </p>
      <div className={styles.stackSteps}>
        <span>copy fixes</span>
        <span>schema placement</span>
        <span>CMS fields</span>
        <span>developer ticket</span>
      </div>
    </div>
  );
};

const CitationBar = ({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "client" | "competitor";
}) => {
  const pct = Math.round((value / Math.max(total, 1)) * 100);
  return (
    <div className={styles.citationBar}>
      <div className={styles.citationMeta}>
        <span>{label}</span>
        <span>{value}/{total}</span>
      </div>
      <div className={styles.citationTrack}>
        <i className={tone === "client" ? styles.citationClient : styles.citationCompetitor} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const Tier2Notice = ({ label, text }: { label: string; text: string }) => (
  <div className={styles.tier2Card}>
    <div className={styles.tier2Head}>
      <div className={styles.srK}>tier 2 citation teaser</div>
      <span className={styles.tier2Badge}>{label}</span>
    </div>
    <p className={styles.tier2Muted}>{text}</p>
  </div>
);
