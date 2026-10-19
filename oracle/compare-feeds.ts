// One-off: the CSV export and the JSON API must give the same print, and the CSV must fit CRE's
// 250 KB response limit. Run on a machine that can reach the feed: npx tsx compare-feeds.ts
import { buildPrint, freshestSnapshot, parseCsvSnapshot, type Snapshot } from "./methodology";

const csvRes = await fetch("https://gpurentalprices.com/gpu-prices.csv");
const csvText = await csvRes.text();
const jsonRes = await fetch("https://gpurentalprices.com/api/latest.json");
const jsonText = await jsonRes.text();
const csv = parseCsvSnapshot(csvText);
const json = JSON.parse(jsonText) as Snapshot;
const a = buildPrint(freshestSnapshot([csv], Date.now()).offers);
const b = buildPrint(json.offers);
console.log(`csv   ${new TextEncoder().encode(csvText).length} bytes  generated ${csv.generated_at}  offers ${csv.offers.length}  -> $${a.price.toFixed(6)} from ${a.sourceCount} venues, ${a.sampleCount} quotes`);
console.log(`json  ${new TextEncoder().encode(jsonText).length} bytes  generated ${json.generated_at}  offers ${json.offers.length}  -> $${b.price.toFixed(6)} from ${b.sourceCount} venues, ${b.sampleCount} quotes`);
console.log(Math.abs(a.price - b.price) < 1e-9 && a.sampleCount === b.sampleCount ? "MATCH" : "DIFFERENT");
