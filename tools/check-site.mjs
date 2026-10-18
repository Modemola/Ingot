// Loads the live site in a real browser and reports what each page shows: the index price,
// whether the indexer-backed cards have data, and any console errors. Writes screenshots.
//
//   node tools/check-site.mjs [base-url] [out-dir]
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "https://ingotx.vercel.app";
const OUT = process.argv[3] ?? "site-check";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  { path: "/", expect: ["H100 index"] },
  { path: "/trade", expect: ["Market activity"] },
  { path: "/credit", expect: ["Loan book"] },
  { path: "/underwrite", expect: [] },
];

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
let failed = false;
for (const { path, expect } of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60_000 }).catch((e) => ({ status: () => e.message }));
  await page.waitForTimeout(12_000); // contract reads and indexer polls settle
  const text = await page.locator("body").innerText();
  const missing = expect.filter((t) => !text.includes(t));
  const unreachable = text.includes("Indexer unreachable");
  const prices = [...new Set(text.match(/\$\d\.\d{2,4}/g) ?? [])].slice(0, 6);
  const ok = res.status() === 200 && !missing.length && !unreachable;
  failed ||= !ok;
  console.log(`\n${ok ? "OK  " : "FAIL"} ${path}  HTTP ${res.status()}  prices seen: ${prices.join(" ") || "none"}`);
  if (missing.length) console.log(`  missing: ${missing.join(", ")}`);
  if (unreachable) console.log("  an indexer card says 'Indexer unreachable'");
  if (errors.length) console.log(`  console errors (${errors.length}):\n    ${[...new Set(errors)].slice(0, 6).join("\n    ")}`);
  await page.screenshot({ path: `${OUT}/${path === "/" ? "home" : path.slice(1)}.png`, fullPage: true });
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
