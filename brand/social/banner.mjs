// X profile banner (1500×500) and avatar (400×400):  node brand/social/banner.mjs
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(new URL("../../web/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const here = path.dirname(fileURLToPath(import.meta.url));
const svg = (n) => readFileSync(path.join(here, "../svg", n), "utf8").replace(/ width="[\d.]+" height="[\d.]+"/, ' width="100%" height="100%"');
const font = (f) => pathToFileURL(path.join(here, "../../video/public/fonts", f)).href;

const banner = `<!doctype html><html><head><style>
@font-face{font-family:N;src:url(${font("newsreader-latin-standard-normal.woff2")})}
@font-face{font-family:NI;src:url(${font("newsreader-latin-standard-italic.woff2")})}
@font-face{font-family:M;src:url(${font("GeistMono.woff2")})}
*{margin:0;box-sizing:border-box}
body{width:1500px;height:500px;background:#090807;overflow:hidden;position:relative;font-family:N;color:#f3ecdf}
.glow{position:absolute;inset:0;background:radial-gradient(700px 380px at 72% 52%,rgba(232,182,97,.18),transparent 70%)}
.grid{position:absolute;inset:0;background-image:radial-gradient(rgba(243,236,223,.07) 1px,transparent 1px);background-size:26px 26px;mask-image:linear-gradient(90deg,transparent 0%,#000 35%,#000 100%)}
.chart{position:absolute;left:520px;right:-20px;top:205px;height:300px}
.copy{position:absolute;left:520px;top:118px}
h1{font-weight:300;font-size:84px;line-height:1;letter-spacing:-.01em}
h1 i{font-family:NI;font-weight:300;color:#e8b661}
.sub{margin-top:22px;font-family:M;font-size:19px;letter-spacing:.28em;color:#b9ae9c}
.tag{position:absolute;right:56px;bottom:40px;font-family:M;font-size:16px;letter-spacing:.26em;color:#867d70}
.mark{position:absolute;left:1185px;top:150px;width:250px;height:250px;opacity:.95}
</style></head><body>
<div class="glow"></div><div class="grid"></div>
<svg class="chart" viewBox="0 0 1000 300" preserveAspectRatio="none"><defs><linearGradient id="f" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e8b661" stop-opacity=".16"/><stop offset="1" stop-color="#e8b661" stop-opacity="0"/></linearGradient></defs>
<path d="M0 230 H90 V205 H170 V215 H250 V180 H330 V190 H420 V160 H500 V170 H590 V140 H680 V150 H770 V118 H860 V96 H1000 V300 H0Z" fill="url(#f)"/>
<path d="M0 230 H90 V205 H170 V215 H250 V180 H330 V190 H420 V160 H500 V170 H590 V140 H680 V150 H770 V118 H860 V96 H1000" fill="none" stroke="#e8b661" stroke-opacity=".55" stroke-width="2.4"/></svg>
<div class="copy"><h1>Compute, <i>priced</i><br>&amp; hedged.</h1><div class="sub">THE GPU RENTAL MARKET · ON MONAD</div></div>
<div class="mark">${svg("ingot-mark.svg")}</div>
<div class="tag">MONAD-SIX-SOOTY.VERCEL.APP</div>
</body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1500, height: 500 }, deviceScaleFactor: 2 });
const tmp = path.join(here, ".banner.html");
writeFileSync(tmp, banner);
await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(here, "x-banner-1500x500.png") });
unlinkSync(tmp);
// avatar: the app icon, square (X crops it to a circle)
await page.setViewportSize({ width: 400, height: 400 });
await page.setContent(`<body style="margin:0;background:#090807">${svg("ingot-icon.svg")}</body>`);
await page.screenshot({ path: path.join(here, "x-avatar-400.png"), clip: { x: 0, y: 0, width: 400, height: 400 } });
await browser.close();
console.log("banner + avatar done");
