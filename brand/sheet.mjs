// The logo sheet: node brand/sheet.mjs → brand/png/ingot-logo-sheet.png
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(new URL("../web/package.json", import.meta.url));
const { chromium } = require("playwright-core");
const here = path.dirname(fileURLToPath(import.meta.url));
const svg = (n) => readFileSync(path.join(here, "svg", n), "utf8").replace(/ width="[\d.]+" height="[\d.]+"/, ' width="100%" height="100%"');
const font = (f) => pathToFileURL(path.join(here, "../video/public/fonts", f)).href;

const html = `<!doctype html><html><head><style>
@font-face{font-family:N;src:url(${font("newsreader-latin-standard-normal.woff2")})}
@font-face{font-family:G;src:url(${font("GeistSans.woff2")})}
@font-face{font-family:M;src:url(${font("GeistMono.woff2")})}
*{box-sizing:border-box;margin:0}
body{width:2400px;height:1600px;background:#090807;color:#f3ecdf;font-family:G;padding:110px 120px;position:relative;overflow:hidden}
body:before{content:"";position:absolute;inset:0;background:radial-gradient(900px 600px at 26% 38%,rgba(232,182,97,.13),transparent 70%)}
.eyebrow{font-family:M;font-size:20px;letter-spacing:.32em;color:#e8b661;text-transform:uppercase}
.grid{position:relative;display:grid;grid-template-columns:1.25fr 1fr;gap:56px;margin-top:46px}
.hero{height:880px;border:1px solid rgba(243,236,223,.1);display:flex;align-items:center;justify-content:center;background:rgba(19,16,13,.55)}
.hero .m{width:760px;height:760px}
.side{display:grid;grid-template-rows:430px 430px;gap:20px}
.lock{border:1px solid rgba(243,236,223,.1);display:flex;align-items:center;justify-content:center}
.lock svg{width:86%;height:auto}
.row{position:relative;display:grid;grid-template-columns:repeat(6,1fr);gap:20px;margin-top:20px;height:330px}
.cell{border:1px solid rgba(243,236,223,.1);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px}
.cell .s{width:150px;height:150px}
.cap{font-family:M;font-size:15px;letter-spacing:.2em;color:#867d70;text-transform:uppercase}
.light{background:#f7f2e8}
.light .cap{color:#7a6f60}
.icon{width:170px;height:170px;border-radius:38px;overflow:hidden;box-shadow:0 20px 60px -20px #000}
.fav{display:flex;gap:26px;align-items:end}
.note{position:absolute;right:120px;top:104px;font-family:N;font-weight:300;font-size:30px;color:#c4baa9}
.note i{color:#e8b661}
</style></head><body>
<div class="eyebrow">Ingot · Logo</div>
<div class="note">A gold bar, with the index <i>struck into it</i>.</div>
<div class="grid">
  <div class="hero"><div class="m">${svg("ingot-mark.svg")}</div></div>
  <div class="side">
    <div class="lock">${svg("ingot-logo-dark-transparent.svg")}</div>
    <div class="lock light">${svg("ingot-logo-light.svg")}</div>
  </div>
</div>
<div class="row">
  <div class="cell"><div class="icon">${svg("ingot-icon.svg")}</div><div class="cap">App icon</div></div>
  <div class="cell"><div class="s">${svg("ingot-mark-mono-gold.svg")}</div><div class="cap">One colour · gold</div></div>
  <div class="cell"><div class="s">${svg("ingot-mark-mono-white.svg")}</div><div class="cap">One colour · white</div></div>
  <div class="cell light"><div class="s">${svg("ingot-mark-mono-black.svg")}</div><div class="cap">One colour · black</div></div>
  <div class="cell"><div class="fav"><img src="png/favicon-64.png" width="64"><img src="png/favicon-32.png" width="32"><img src="png/favicon-16-16.png" width="16"></div><div class="cap">Favicon 64 · 32 · 16</div></div>
  <div class="cell"><div style="display:flex;gap:12px">${["#090807", "#e8b661", "#f6dca6", "#b98535", "#f3ecdf"].map((c) => `<div style="width:40px;height:110px;background:${c};border:1px solid rgba(243,236,223,.18)"></div>`).join("")}</div><div class="cap">Palette</div></div>
</div>
</body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 2400, height: 1600 } });
writeFileSync(path.join(here, "sheet.tmp.html"), html);
await page.goto(pathToFileURL(path.join(here, "sheet.tmp.html")).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(here, "png/ingot-logo-sheet.png") });
await browser.close();
unlinkSync(path.join(here, "sheet.tmp.html"));
console.log("sheet done");
