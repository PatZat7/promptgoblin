import { DEFAULT_PREFS, STORAGE_KEYS } from "@/lib/ui-store";

/**
 * Blocking inline script — runs synchronously in <head> during HTML parsing,
 * before the first paint, so the saved palette/motion/density/grain are applied
 * with no flash of the default theme. <html> carries suppressHydrationWarning
 * because this mutates its attributes before React hydrates.
 */
const source = `(function(){try{var d=document.documentElement,k=${JSON.stringify(
  STORAGE_KEYS,
)},f=${JSON.stringify(
  DEFAULT_PREFS,
)};for(var p in k){var v=localStorage.getItem(k[p])||f[p];if(v)d.setAttribute("data-"+p,v)}}catch(e){}})()`;

export const ThemeScript = () => (
  <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: source }} />
);
