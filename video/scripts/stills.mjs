// Render QA stills at given seconds: node scripts/stills.mjs out/qa 1.5 4 9 ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";

const [outDir, ...secs] = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER || "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "Film", browserExecutable });
for (const s of secs) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(s) * composition.fps));
  const t0 = Date.now();
  await renderStill({ serveUrl, composition, frame, output: path.join(outDir, `t${String(s).padStart(7, "0")}.jpg`), imageFormat: "jpeg", jpegQuality: 85, browserExecutable });
  console.log(s, Date.now() - t0, "ms");
}
