import type { Metadata } from "next";
import Link from "next/link";
import styles from "./welcome.module.css";

export const metadata: Metadata = {
  title: "Welcome - Prompt Goblin",
  robots: { index: false, follow: false },
};

const WelcomePage = () => (
  <div className={styles.wrap}>
    <section className={styles.card} aria-labelledby="welcome-title">
      <p className={styles.command}>payment confirmed</p>
      <h1 id="welcome-title" className={styles.title}>
        Your goblins are assembling.
      </h1>
      <p className={styles.lede}>
        We just emailed you a <strong>one-click sign-in link</strong>. Open it to
        reach your dashboard — no password to set, no second step.
      </p>
      <p className={styles.note}>
        It can take a minute to arrive. Check spam too — goblins lurk there. The
        link expires after 24 hours; you can always request a fresh one from the
        login page.
      </p>
      <div className={styles.actions}>
        <Link className="btn" href="/login" data-cursor="./login">
          Go to login <span className="arr">→</span>
        </Link>
      </div>
      <div className={styles.footer}>
        Didn&apos;t get the email? Write us at{" "}
        <a href="mailto:goblins@promptgoblin.io">goblins@promptgoblin.io</a> and a
        real human will sort it out.
      </div>
    </section>
  </div>
);

export default WelcomePage;
