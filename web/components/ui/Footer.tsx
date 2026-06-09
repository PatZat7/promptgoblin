import Link from "next/link";
import styles from "./Footer.module.css";

export const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.inner}>
      <div className={styles.brand}>
        <Link href="/" className={styles.home}>Prompt_Goblin™</Link>
        <p className={styles.tagline}>AI search visibility · technical SEO · accessibility</p>
      </div>

      <nav className={styles.nav} aria-label="Footer">
        <div className={styles.col}>
          <p className={styles.colTitle}>Product</p>
          <ul>
            <li><Link href="/methodology">How it works</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <p className={styles.colTitle}>Learn</p>
          <ul>
            <li><Link href="/learn/aeo-vs-geo">AEO vs GEO</Link></li>
            <li><Link href="/learn/how-to-show-up-in-chatgpt">How to show up in ChatGPT</Link></li>
            <li><Link href="/learn/technical-seo-for-ai-search">Technical SEO for AI search</Link></li>
            <li><Link href="/learn/bing-rank-and-ai-citations">Bing rank and AI citations</Link></li>
            <li><Link href="/learn/accessibility-seo-audit">Accessibility SEO audit</Link></li>
          </ul>
        </div>

        <div className={styles.col}>
          <p className={styles.colTitle}>Docs</p>
          <ul>
            <li><Link href="/docs/bing-webmaster-tools">Bing Webmaster Tools guide</Link></li>
            <li><Link href="/docs/report-guide">Report guide</Link></li>
          </ul>
        </div>
      </nav>

      <div className={styles.bottom}>
        <span>© Prompt_Goblin™ 2024–2026 · Visible AF</span>
        <Link href="mailto:goblins@promptgoblin.io" className={styles.email}>goblins@promptgoblin.io</Link>
      </div>
    </div>
  </footer>
);
