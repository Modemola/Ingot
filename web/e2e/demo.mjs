// Records the product demo: a real browser driving the live site, a real wallet signing real
// transactions. Output is raw footage plus a log of when each step happened, for the edit.
//
//   WALLET_KEY=0x… BASE_URL=https://ingotx.vercel.app node e2e/demo.mjs
//
// The wallet is a minimal EIP-1193 provider in the page: reads go straight to the RPC, and
// eth_sendTransaction is handed to Node, which signs with WALLET_KEY. The key never enters the
// page. Frames come from Chrome's screencast at 1920×1080; a drawn cursor shows where the
// pointer is, because headless Chrome has none.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright-core";
import { createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const BASE_URL = process.env.BASE_URL ?? "https://ingotx.vercel.app";
const RPC_URL = process.env.RPC_URL ?? "https://testnet-rpc.monad.xyz";
const CHAIN_ID = Number(process.env.CHAIN_ID ?? 10143);
const EXPLORER = process.env.EXPLORER ?? "https://testnet.monadscan.com";
const OUT = process.env.OUT_DIR ?? "demo-out";
const KEY = process.env.WALLET_KEY;
if (!KEY) throw new Error("WALLET_KEY is required");

const account = privateKeyToAccount(KEY);
const chain = defineChain({ id: CHAIN_ID, name: "chain", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [RPC_URL] } } });
const wallet = createWalletClient({ account, chain, transport: http(RPC_URL) });

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "frames"), { recursive: true });

const events = [];
const mark = (name, extra = {}) => {
  events.push({ name, t: Date.now() / 1000, ...extra });
  console.log(`${new Date().toISOString().slice(11, 19)}  ${name}${extra.hash ? " " + extra.hash : ""}`);
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
// A 1920×1080 window with the page at 4/3 zoom: the site's 1440-wide desktop layout, drawn at
// full-HD resolution (Chrome's screencast captures at layout size, so device scale won't do it).
const VW = 1920;
const VH = 1080;
const context = await browser.newContext({ viewport: { width: VW, height: VH } });
await context.addInitScript(() => {
  const zoom = () => (document.documentElement.style.zoom = String(4 / 3));
  if (document.documentElement) zoom();
  document.addEventListener("DOMContentLoaded", zoom);
});

await context.exposeFunction("__ingotSend", async (tx) => {
  const hash = await wallet.sendTransaction({
    to: tx.to,
    data: tx.data,
    value: tx.value ? BigInt(tx.value) : 0n,
    gas: tx.gas ? BigInt(tx.gas) : undefined,
  });
  mark("tx", { hash });
  return hash;
});

await context.addInitScript(
  ({ address, rpc }) => {
    window.ethereum = {
      isMetaMask: false,
      on() {},
      removeListener() {},
      async request({ method, params = [] }) {
        if (method === "eth_requestAccounts" || method === "eth_accounts") return [address];
        if (method === "wallet_requestPermissions") return [{ parentCapability: "eth_accounts" }];
        if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") return null;
        if (method === "eth_sendTransaction") return window.__ingotSend(params[0]);
        const response = await fetch(rpc, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
        });
        const body = await response.json();
        if (body.error) throw Object.assign(new Error(body.error.message), body.error);
        return body.result;
      },
    };
    // A visible pointer, with a ripple on each click.
    const draw = () => {
      if (document.getElementById("__cursor")) return;
      const c = document.createElement("div");
      c.id = "__cursor";
      c.innerHTML =
        '<svg width="21" height="21" viewBox="0 0 26 26"><path d="M3 2 L3 21 L8.2 16.4 L11.6 24 L15 22.5 L11.7 15 L18.6 15 Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
      Object.assign(c.style, { position: "fixed", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none", filter: "drop-shadow(0 2px 4px rgba(0,0,0,.6))", transform: "translate(-100px,-100px)" });
      document.documentElement.appendChild(c);
      const last = JSON.parse(sessionStorage.getItem("__cur") || "null");
      if (last) c.style.transform = `translate(${last[0] - 3}px,${last[1] - 2}px)`;
      addEventListener("mousemove", (e) => {
        c.style.transform = `translate(${e.clientX - 3}px,${e.clientY - 2}px)`;
        sessionStorage.setItem("__cur", JSON.stringify([e.clientX, e.clientY]));
      }, true);
      addEventListener("mousedown", (e) => {
        const r = document.createElement("div");
        Object.assign(r.style, { position: "fixed", left: `${e.clientX - 18}px`, top: `${e.clientY - 18}px`, width: "36px", height: "36px", borderRadius: "50%", border: "2px solid rgba(232,182,97,.9)", zIndex: "2147483646", pointerEvents: "none", transition: "transform .45s ease-out, opacity .45s ease-out" });
        document.documentElement.appendChild(r);
        requestAnimationFrame(() => { r.style.transform = "scale(1.8)"; r.style.opacity = "0"; });
        setTimeout(() => r.remove(), 600);
      }, true);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw);
    else draw();
  },
  { address: account.address, rpc: RPC_URL },
);

const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

// --- footage: Chrome's screencast, every frame with its timestamp
const cdp = await context.newCDPSession(page);
const frames = [];
let writing = Promise.resolve();
cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
  const i = frames.length;
  frames.push(metadata.timestamp);
  writing = writing.then(() => writeFileSync(join(OUT, "frames", `${String(i).padStart(6, "0")}.jpg`), Buffer.from(data, "base64")));
  cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
const startCast = () => cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: VW, maxHeight: VH, everyNthFrame: 1 });

// --- choreography helpers
const rest = (ms) => page.waitForTimeout(ms);
let pointer = [1700, 900];
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
async function moveTo(x, y, ms = 700) {
  const [x0, y0] = pointer;
  const steps = Math.max(8, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const k = ease(i / steps);
    await page.mouse.move(x0 + (x - x0) * k, y0 + (y - y0) * k);
    await page.waitForTimeout(ms / steps);
  }
  pointer = [x, y];
}
// Lenis smooths wheel input, so scroll the way a person does: in wheel steps, until the target
// sits at `align` of the viewport height.
async function into(locator, align = 0.35) {
  await locator.waitFor({ state: "attached", timeout: 60_000 });
  for (let i = 0; i < 60; i++) {
    const b = await locator.boundingBox();
    if (!b) break;
    const delta = b.y + b.height / 2 - VH * align;
    if (Math.abs(delta) < 40) break;
    await page.mouse.wheel(0, Math.max(-320, Math.min(320, delta)));
    await rest(80);
  }
  await rest(450);
}
async function click(locator, { align = 0.45, pause = 350, ms = 750 } = {}) {
  await locator.waitFor({ state: "visible", timeout: 60_000 });
  // Aim, and re-aim if the page moved under the pointer (scroll settling, a late layout).
  for (let attempt = 0; attempt < 4; attempt++) {
    const b0 = await locator.boundingBox();
    if (!b0 || b0.y < 100 || b0.y + b0.height > VH - 40) await into(locator, align);
    const b = await locator.boundingBox();
    await moveTo(b.x + b.width / 2, b.y + b.height / 2, attempt ? 350 : ms);
    await rest(pause);
    const c = await locator.boundingBox();
    if (c && Math.abs(c.x - b.x) < 3 && Math.abs(c.y - b.y) < 3) break;
  }
  await page.mouse.down();
  await rest(70);
  await page.mouse.up();
}
// Navigate with the header link, then let the new route settle before doing anything else.
async function go(name, ready) {
  await click(nav(name), { ms: 900 });
  await has(ready);
  await rest(3200);
}
async function type(locator, text) {
  await click(locator);
  await page.keyboard.press("Control+A");
  await rest(120);
  await locator.pressSequentially(text, { delay: 110 });
}
const has = (text, timeout = 90_000) =>
  page.waitForFunction((t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()), text, { timeout });
const button = (name) => page.getByRole("button", { name }).first();
const card = (title) => page.locator("section", { has: page.locator("h2", { hasText: title }) }).first();
const nav = (name) => page.locator("header").getByRole("link", { name }).first();

let step = "start";
try {
  // 1 — the landing page
  step = "landing";
  await page.goto(BASE_URL, { waitUntil: "load" });
  await rest(2500);
  await startCast();
  mark("landing");
  await page.mouse.move(...pointer);
  await rest(4500);
  for (let i = 0; i < 9; i++) {
    await page.mouse.wheel(0, 240);
    await rest(260);
  }
  await rest(2500);
  for (let i = 0; i < 9; i++) {
    await page.mouse.wheel(0, -240);
    await rest(120);
  }
  await rest(1200);

  // 2 — the terminal, a fresh wallet, test USDC
  step = "trade";
  mark("to-trade");
  await go(/^trade$/i, "Open a position");
  mark("connect");
  await click(button(/connect wallet/i));
  await rest(900);
  const picker = page.getByRole("dialog");
  if (await picker.isVisible().catch(() => false)) {
    await click(picker.getByRole("button", { name: /browser wallet/i }));
  }
  await has(account.address.slice(0, 6));
  mark("connected");
  await rest(2500);

  step = "index";
  mark("index");
  const chart = card("H100 on-demand rental index");
  await into(chart, 0.48);
  const svg = chart.locator("svg").first();
  const sb = await svg.boundingBox();
  await moveTo(sb.x + sb.width * 0.08, sb.y + sb.height * 0.55, 800);
  for (let i = 0; i <= 90; i++) {
    await page.mouse.move(sb.x + sb.width * (0.08 + 0.9 * (i / 90)), sb.y + sb.height * 0.55);
    pointer = [sb.x + sb.width * (0.08 + 0.9 * (i / 90)), sb.y + sb.height * 0.55];
    await rest(55);
  }
  await rest(1800);
  mark("index-done");

  step = "faucet";
  mark("faucet");
  await click(button(/250,000 test USDC/i));
  await has("Test USDC is in your wallet");
  mark("faucet-done");
  await rest(2500);

  step = "margin";
  mark("margin");
  const amount = page.locator("input[placeholder='0.00']").first();
  await type(amount, "20000");
  await rest(800);
  const approve = button(/^approve$/i);
  if (await approve.isVisible().catch(() => false)) {
    await click(approve);
    await button(/^deposit$/i).waitFor({ timeout: 90_000 });
    mark("approved");
    await rest(1200);
  }
  await click(button(/^deposit$/i));
  await has("Posted as margin");
  await page.waitForFunction(() => document.querySelector("input[placeholder='0.00']")?.value === "", null, { timeout: 90_000 });
  mark("deposited");
  await rest(2500);

  step = "ticket";
  mark("ticket");
  const ticket = card("Open a position");
  await into(ticket, 0.42);
  await click(ticket.getByRole("button", { name: /^10$/ }));
  await rest(4500);
  mark("ticket-preview");
  await click(button(/go long/i));
  await has("Filled. Your position is live.");
  mark("filled");
  await rest(2500);
  const position = card("Your position");
  await into(position, 0.4);
  mark("position");
  await rest(5000);

  step = "explorer";
  const lastTx = [...events].reverse().find((e) => e.name === "tx");
  if (lastTx && EXPLORER) {
    mark("explorer");
    await page.goto(`${EXPLORER}/tx/${lastTx.hash}`, { waitUntil: "domcontentloaded" }).catch(() => {});
    await rest(7000);
    mark("explorer-done");
    await page.goBack({ waitUntil: "load" }).catch(() => page.goto(`${BASE_URL}/trade`));
    await has("Open a position");
    await rest(1500);
  }

  // 3 — hedged credit
  step = "credit";
  mark("to-credit");
  await go(/^credit$/i, "Draw against an offtake");
  const form = card("Draw against an offtake");
  await into(form, 0.35);
  mark("example");
  const hoursInput = page.locator("input[placeholder='100000']").first();
  for (let i = 0; i < 3 && (await hoursInput.inputValue()) !== "100000"; i++) {
    await click(form.getByRole("button", { name: /^example$/i }));
    await rest(1200);
  }
  await rest(1000);
  mark("minimum");
  const marginInput = form.locator("input[placeholder='0.00']").first();
  for (let i = 0; i < 3 && (await marginInput.inputValue()) === ""; i++) {
    await click(form.getByRole("button", { name: /^minimum$/i }));
    await rest(1200);
  }
  await rest(1300);
  const approveCredit = button(/^approve usdc$/i);
  if (await approveCredit.isVisible().catch(() => false)) {
    await click(approveCredit);
    await button(/draw, hedged/i).waitFor({ timeout: 90_000 });
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => /draw, hedged/i.test(b.innerText) && !b.disabled), null, { timeout: 90_000 });
    mark("credit-approved");
    await rest(1200);
  }
  mark("draw");
  await click(button(/draw, hedged/i));
  await has("Drawn, and hedged in the same block.");
  mark("drawn");
  await rest(3000);

  step = "recovery";
  const slider = page.getByRole("slider", { name: /settlement rate/i });
  await into(slider, 0.62);
  await rest(1500);
  mark("sweep");
  const rb = await slider.boundingBox();
  const value = Number(await slider.inputValue());
  const max = Number(await slider.getAttribute("max"));
  const thumb = (v) => rb.x + 8 + (rb.width - 16) * (v / max);
  await moveTo(thumb(value), rb.y + rb.height / 2, 800);
  await rest(300);
  await page.mouse.down();
  const sweep = async (from, to, ms) => {
    const n = Math.round(ms / 30);
    for (let i = 1; i <= n; i++) {
      const v = from + (to - from) * ease(i / n);
      pointer = [thumb(v), rb.y + rb.height / 2];
      await page.mouse.move(...pointer);
      await rest(30);
    }
  };
  await sweep(value, 0, 4500);
  await rest(1800);
  await sweep(0, max * 0.55, 4000);
  await page.mouse.up();
  mark("sweep-done");
  await rest(3000);

  // 4 — the underwriter vault
  step = "underwrite";
  mark("to-underwrite");
  await go(/^underwrite$/i, "Take the other side");
  mark("vault");
  const vaultAmount = page.locator("input[placeholder='0.00']").first();
  await type(vaultAmount, "10000");
  await rest(800);
  const approveVault = button(/^approve$/i);
  if (await approveVault.isVisible().catch(() => false)) {
    await click(approveVault);
    await page.waitForFunction(() => [...document.querySelectorAll("button")].find((b) => /^deposit$/i.test(b.innerText.trim()))?.disabled === false, null, { timeout: 90_000 });
    mark("vault-approved");
    await rest(1200);
  }
  await click(button(/^deposit$/i));
  await page.waitForFunction(() => /Your shares\s*[1-9][\d,]*\.\d{2}/.test(document.body.innerText), null, { timeout: 90_000 });
  mark("vault-deposited");
  await rest(4000);

  // 5 — close the trade
  step = "close";
  mark("to-close");
  await go(/^trade$/i, "Your position");
  const pos = card("Your position");
  await into(pos, 0.42);
  await rest(2000);
  mark("close");
  await click(pos.getByRole("button", { name: /close position/i }));
  await has("No open position", 90_000);
  mark("closed");
  await rest(4000);
  mark("end");
} catch (error) {
  console.error(`FAILED at ${step}: ${String(error).split("\n")[0]}`);
  await page.screenshot({ path: join(OUT, `failure-${step}.png`) }).catch(() => {});
  process.exitCode = 1;
} finally {
  await cdp.send("Page.stopScreencast").catch(() => {});
  await writing;
  writeFileSync(join(OUT, "frames.json"), JSON.stringify(frames));
  writeFileSync(join(OUT, "events.json"), JSON.stringify({ address: account.address, events, errors: errors.slice(0, 20) }, null, 1));
  // ffmpeg concat list: each frame held until the next arrives
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const d = i + 1 < frames.length ? frames[i + 1] - frames[i] : 0.5;
    lines.push(`file 'frames/${String(i).padStart(6, "0")}.jpg'`, `duration ${Math.max(0.001, d).toFixed(4)}`);
  }
  if (frames.length) lines.push(`file 'frames/${String(frames.length - 1).padStart(6, "0")}.jpg'`);
  writeFileSync(join(OUT, "frames.txt"), lines.join("\n") + "\n");
  console.log(`${frames.length} frames, ${frames.length ? (frames.at(-1) - frames[0]).toFixed(1) : 0}s`);
  await browser.close();
}
