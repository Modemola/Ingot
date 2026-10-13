// Rasterise the logo SVGs:  node brand/render.mjs   (Chromium via playwright-core)
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(new URL("../web/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "png");
mkdirSync(out, { recursive: true });

// name → output sizes (px, longest side)
const SIZES = {
  "ingot-mark": [1024, 512, 256],
  "ingot-mark-small": [128, 64],
  "ingot-mark-mono-gold": [512],
  "ingot-mark-mono-black": [512],
  "ingot-mark-mono-white": [512],
  "ingot-icon": [1024, 512, 180],
  favicon: [64, 32],
  "favicon-16": [16],
  "ingot-logo-dark": [2400],
  "ingot-logo-light": [2400],
  "ingot-logo-dark-transparent": [2400],
  "ingot-wordmark": [1600],
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage();
for (const file of readdirSync(path.join(here, "svg")).filter((f) => f.endsWith(".svg"))) {
  const name = file.replace(/\.svg$/, "");
  const src = readFileSync(path.join(here, "svg", file), "utf8");
  const [, w, h] = src.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  for (const size of SIZES[name] ?? [512]) {
    const k = size / Math.max(w, h);
    const W = Math.round(w * k), H = Math.round(h * k);
    await page.setViewportSize({ width: W, height: H });
    await page.setContent(`<html><body style="margin:0;background:transparent">${src.replace(/width="[\d.]+" height="[\d.]+"/, `width="${W}" height="${H}"`)}</body></html>`);
    await page.screenshot({ path: path.join(out, `${name}-${size}.png`), omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } });
  }
}
await browser.close();
console.log("rendered", readdirSync(out).length, "png");
