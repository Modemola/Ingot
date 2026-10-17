// Day 2 graphic: each provider's 78-day mean H100 price against the index.  node brand/social/chart-basis.mjs
import { createRequire } from "node:module";
import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(new URL("../../web/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const here = path.dirname(fileURLToPath(import.meta.url));
const font = (f) => pathToFileURL(path.join(here, "../../video/public/fonts", f)).href;

// 78-day mean basis vs the index, % (video/src/data.ts BASIS, from tools/build_index.py output)
const BASIS = [["Voltage Park", -45.3], ["GMI Cloud", -44.8], ["TensorDock", -37.9], ["RunPod", -14.3], ["Lambda", 0.1], ["Crusoe", 7.2], ["CoreWeave", 69.2], ["AWS", 237.2]];
const BELOW = "#3a94c0", ABOVE = "#c48526", NEUTRAL = "#8a8278";
const X0 = -60, X1 = 250, W = 980; // axis, px
const x = (v) => ((v - X0) / (X1 - X0)) * W;

const rows = BASIS.map(([name, b]) => {
  const c = Math.abs(b) < 1 ? NEUTRAL : b < 0 ? BELOW : ABOVE;
  const left = Math.min(x(0), x(b)), width = Math.max(4, Math.abs(x(b) - x(0)));
  const label = `${b > 0 ? "+" : b < 0 ? "−" : ""}${Math.abs(b).toFixed(0)}%`;
  const labelLeft = b < 0 ? left - 12 : left + width + 12;
  return `<div class="row"><div class="name">${name}</div><div class="track">
    <div class="bar" style="left:${left}px;width:${width}px;background:${c};border-radius:${b < 0 ? "4px 0 0 4px" : "0 4px 4px 0"}"></div>
    <div class="val" style="left:${labelLeft}px;${b < 0 ? "transform:translateX(-100%)" : ""}">${label}</div></div></div>`;
}).join("");

const html = `<!doctype html><html><head><style>
@font-face{font-family:N;src:url(${font("newsreader-latin-standard-normal.woff2")})}
@font-face{font-family:NI;src:url(${font("newsreader-latin-standard-italic.woff2")})}
@font-face{font-family:G;src:url(${font("GeistSans.woff2")})}
@font-face{font-family:M;src:url(${font("GeistMono.woff2")})}
*{margin:0;box-sizing:border-box}
body{width:1600px;height:900px;background:#0f0d0b;color:#f3ecdf;font-family:G;padding:70px 90px;position:relative}
.eyebrow{font-family:M;font-size:17px;letter-spacing:.28em;color:#e8b661}
h1{font-family:N;font-weight:300;font-size:58px;margin-top:14px;letter-spacing:-.01em}
h1 i{font-family:NI;color:#e8b661}
.sub{margin-top:12px;font-size:21px;color:#b9ae9c}
.chart{position:relative;margin-top:70px}
.row{display:flex;align-items:center;height:62px}
.name{width:250px;font-size:24px;color:#e6dfd2}
.track{position:relative;width:${W}px;height:36px}
.bar{position:absolute;top:2px;height:32px}
.val{position:absolute;top:2px;line-height:32px;font-family:M;font-size:21px;color:#e6dfd2;white-space:nowrap}
.zero{position:absolute;left:${250 + x(0)}px;top:-14px;bottom:-10px;width:2px;background:#f3ecdf;opacity:.85}
.zl{position:absolute;left:${250 + x(0)}px;top:-40px;transform:translateX(-50%);font-family:M;font-size:15px;letter-spacing:.2em;color:#f3ecdf}
.legend{position:absolute;left:90px;bottom:62px;display:flex;gap:32px;font-size:18px;color:#b9ae9c;align-items:center}
.sw{display:inline-block;width:14px;height:14px;border-radius:3px;margin-right:9px;vertical-align:-1px}
.src{position:absolute;right:90px;bottom:62px;font-family:M;font-size:14px;color:#867d70;text-align:right;line-height:1.6}
.brand{position:absolute;right:90px;top:70px;font-family:N;font-size:30px;color:#f3ecdf}
</style></head><body>
<div class="eyebrow">THE H100 BASIS · 78 DAYS</div>
<h1>Same GPU, same index, <i>eight different prices.</i></h1>
<div class="sub">Each provider's average posted on-demand H100 rate, relative to the Ingot index.</div>
<div class="brand">Ingot</div>
<div class="chart"><div class="zl">INDEX</div><div class="zero"></div>${rows}</div>
<div class="legend"><span><span class="sw" style="background:${BELOW}"></span>Below the index</span><span><span class="sw" style="background:${ABOVE}"></span>Above the index</span></div>
<div class="src">78-day mean, Jul–Sep 2026 · data: gpu-rental-prices (CC BY 4.0)<br>ingotx.vercel.app</div>
</body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
const tmp = path.join(here, ".chart.html");
writeFileSync(tmp, html);
await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(here, "day2-basis.png") });
unlinkSync(tmp);
await browser.close();
console.log("chart done");
