import styles from "./ScanProofThumb.module.css";

type ScanProofThumbProps = {
  /** Short-TTL signed URL minted server-side — never a public object URL */
  signedUrl: string | null;
  /** Honest label for alt text (e.g. "before @ 1440px") */
  label: string;
  width: number;
  height: number;
};

/**
 * Scan-proof thumbnail.
 * - Receives an already-minted signed URL from the server — the client
 *   never sees the storage path or service key.
 * - Broken / expired / null URL → graceful "proof expired, refresh" placeholder.
 */
export function ScanProofThumb({ signedUrl, label, width, height }: ScanProofThumbProps) {
  if (!signedUrl) {
    return (
      <div
        className={styles.placeholder}
        style={{ width: Math.min(width, 240), aspectRatio: `${width}/${height}` }}
        role="img"
        aria-label={`Scan proof unavailable: ${label}`}
      >
        <span className={styles.placeholderText}>proof expired — refresh to reload</span>
      </div>
    );
  }

  return (
    <figure className={styles.figure}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={signedUrl}
        alt={label}
        width={Math.min(width, 240)}
        height={Math.round((Math.min(width, 240) / width) * height)}
        className={styles.thumb}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          // Replace with expired placeholder on load error
          const target = e.currentTarget;
          target.style.display = "none";
          const placeholder = target.nextElementSibling as HTMLElement | null;
          if (placeholder) placeholder.style.display = "flex";
        }}
      />
      <div className={styles.expiredPlaceholder} style={{ display: "none" }} aria-hidden="true">
        proof expired — refresh
      </div>
      <figcaption className={styles.caption}>{label}</figcaption>
    </figure>
  );
}
