import { chromium } from "playwright";
const URL = process.env.PG_URL || "http://localhost:8127/";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
await p.waitForTimeout(4000); // let Babel transpile + mount + loader clear
const shots = [
  ["section[data-section-name='Spellbook']", "_shot-spellbook.png"],
  ["#services", "_shot-services.png"],
  ["#mesh", "_shot-mesh.png"],
  ["#scan", "_shot-scan.png"],
  ["#pricing", "_shot-pricing.png"],
];
const out = {};
for (const [sel, file] of shots) {
  const el = await p.$(sel);
  if (el) { await el.scrollIntoViewIfNeeded().catch(()=>{}); await p.waitForTimeout(400); await el.screenshot({ path: file }); out[sel] = "ok"; }
  else out[sel] = "NOT FOUND";
}
// also pull the rendered text of each so copy work is grounded in reality
const texts = await p.evaluate(() => {
  const grab = (sel) => { const e = document.querySelector(sel); return e ? e.innerText.replace(/\s+/g," ").trim().slice(0,500) : null; };
  return {
    spellbook: grab("section[data-section-name='Spellbook']"),
    services: grab("#services"),
    mesh: grab("#mesh"),
  };
});
console.log(JSON.stringify({ shots: out, texts }, null, 1));
await b.close();
