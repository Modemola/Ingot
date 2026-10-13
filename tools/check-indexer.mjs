// Runs the app's own GraphQL queries against the hosted Envio indexer and prints what comes back.
//
//   node tools/check-indexer.mjs [endpoint]
//
// The queries are read straight out of web/components/Activity.tsx, so this checks exactly what
// the site sends, not a paraphrase of it.
import { readFileSync } from "node:fs";

const url = process.argv[2] ?? "https://indexer.dev.hyperindex.xyz/dd86630/v1/graphql";
const source = readFileSync(new URL("../web/components/Activity.tsx", import.meta.url), "utf8");
const queries = [...source.matchAll(/\/\* GraphQL \*\/ `([\s\S]*?)`/g)].map((m) => m[1]);

async function ask(query, variables = {}) {
  const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, variables }) });
  return { status: response.status, body: await response.json().catch(() => null) };
}

let failed = false;
const meta = await ask("{ chain_metadata { chain_id block_height latest_processed_block num_events_processed is_hyper_sync } }");
console.log("sync:", JSON.stringify(meta.body?.data ?? meta.body));
for (const query of queries) {
  const name = query.match(/query (\w+)/)?.[1];
  const { status, body } = await ask(query, { series: "0" });
  const ok = status === 200 && body?.data && !body.errors;
  failed ||= !ok;
  console.log(`\n${name}: HTTP ${status} ${ok ? "ok" : "FAILED"}`);
  console.log(JSON.stringify(body?.errors ?? body?.data, null, 1).slice(0, 2500));
}
process.exit(failed ? 1 : 0);
