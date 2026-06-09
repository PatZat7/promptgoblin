import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard · Prompt Goblin",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>{children}</div>;
}
