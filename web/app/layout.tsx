import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "./fonts";
import { UiStoreProvider } from "@/components/providers/UiStoreProvider";
import { HudTop } from "@/components/hud/HudTop";
import { HudBottom } from "@/components/hud/HudBottom";
import { Analytics } from "@/components/system/Analytics";
import { Cursor } from "@/components/system/Cursor";
import { Loader } from "@/components/system/Loader";
import { Grain } from "@/components/system/Grain";
import { JsonLd } from "@/components/system/JsonLd";
import { ThemeScript } from "@/components/system/ThemeScript";
import { structuredData } from "@/lib/structured-data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Prompt_Goblin™ · AI search visibility & technical SEO",
    template: "%s · Prompt Goblin",
  },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: "Prompt Goblin · Get found by robots. Stay usable by humans.",
    description:
      "When an AI names the best in your category, is it you, or your competitor? We measure that gap and ship human-reviewed fixes to close it. AEO · technical SEO · WCAG accessibility.",
    url: SITE.url,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Prompt Goblin · Get found by robots. Stay usable by humans.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Goblin · Visible AF",
    description:
      "When an AI names the best in your category, is it you, or your competitor? We measure that gap and ship human-reviewed fixes to close it.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0a" },
    { media: "(prefers-color-scheme: light)", color: "#f4f2ec" },
  ],
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html
    lang="en"
    className={fontVariables}
    data-palette="dark"
    data-motion="med"
    data-density="default"
    data-grain="on"
    suppressHydrationWarning
  >
    <head>
      <ThemeScript />
    </head>
    <body>
      <Loader />
      {structuredData.map((data, i) => (
        <JsonLd key={i} data={data} />
      ))}
      <UiStoreProvider>
        <HudTop />
        <main>{children}</main>
        <HudBottom />
      </UiStoreProvider>
      <Grain />
      <Cursor />
      <Analytics />
    </body>
  </html>
);

export default RootLayout;
