/// The Ingot index methodology, in the one place both the workflow and the simulator read it from.
///
/// It mirrors tools/build_index.py exactly, and deliberately so: the number a CRE node computes at
/// runtime has to be the same number the published methodology says it computes, or the hash in
/// `IngotIndex.methodologyHash` is decoration.
///
/// Two stages:
///   1. Per venue, the median across that venue's H100 SKUs — one observation per venue, so a
///      provider listing many SKUs cannot dominate the print.
///   2. Across venues, a 10% trimmed mean of those medians.
///
/// On-demand and secure capacity only. Spot, community and serverless are different products with
/// different availability and billing; mixing them into one print is how an index stops meaning
/// anything.

export const INCLUDED_KINDS = ["on-demand", "secure"] as const;
export const TRIM_FRACTION = 0.1;
export const MIN_VENUES = 3;

export type Offer = {
  provider: string;
  gpu: string;
  usd_hr: number;
  kind: string;
};

export type IndexPrint = {
  /// USD per GPU-hour, 18 decimals, ready for IngotIndex.
  priceWei: bigint;
  price: number;
  sampleCount: number;
  sourceCount: number;
};

export function isH100OnDemand(offer: Offer): boolean {
  return (
    typeof offer.gpu === "string" &&
    offer.gpu.toLowerCase().startsWith("h100") &&
    (INCLUDED_KINDS as readonly string[]).includes(offer.kind) &&
    typeof offer.usd_hr === "number" &&
    offer.usd_hr > 0
  );
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function trimmedMean(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const cut = Math.floor(sorted.length * fraction);
  const kept = sorted.slice(cut, sorted.length - cut);
  const used = kept.length > 0 ? kept : sorted;
  return used.reduce((sum, value) => sum + value, 0) / used.length;
}

/// Turn a batch of venue offers into a single print, or throw if the sample is too thin to publish.
export function buildPrint(offers: Offer[]): IndexPrint {
  const byVenue = new Map<string, number[]>();
  let sampleCount = 0;

  for (const offer of offers) {
    if (!isH100OnDemand(offer)) continue;
    const existing = byVenue.get(offer.provider);
    if (existing) existing.push(offer.usd_hr);
    else byVenue.set(offer.provider, [offer.usd_hr]);
    sampleCount += 1;
  }

  if (byVenue.size < MIN_VENUES) {
    throw new Error(`too few venues to publish: ${byVenue.size} (need ${MIN_VENUES})`);
  }

  const medians = [...byVenue.values()].map(median);
  const price = trimmedMean(medians, TRIM_FRACTION);

  return {
    price,
    priceWei: toWei(price),
    sampleCount,
    sourceCount: byVenue.size,
  };
}

/// A copy of the venue dataset: every offer, stamped with when it was generated.
export type Snapshot = { generated_at?: string; offers: Offer[] };

/// The print is stamped with the time it is published, so the data behind it must be current: a
/// feed that stopped updating would otherwise keep publishing yesterday's rate as today's. The
/// same limit as the scheduled publisher (tools/publish-index.mjs).
export const MAX_SNAPSHOT_AGE_HOURS = 36;

/// The dataset's CSV export as a snapshot. It carries the same offers as the JSON at a fifth of
/// the size, which matters: CRE caps an HTTP response at 250 KB, and the JSON outgrew that.
/// Columns: date, provider, gpu, vram_gb, usd_per_hr, kind, source_url, fetched_at. A snapshot is
/// as fresh as its newest quote.
export function parseCsvSnapshot(text: string): Snapshot {
  const rows = text.split(/\r?\n/).filter((line) => line.trim() !== "").map(splitCsvLine);
  const [header, ...body] = rows;
  if (!header) throw new Error("empty CSV");
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`CSV has no ${name} column`);
    return i;
  };
  const [provider, gpu, usd, kind, fetched] = [col("provider"), col("gpu"), col("usd_per_hr"), col("kind"), col("fetched_at")];
  let newest = Number.NEGATIVE_INFINITY;
  const offers: Offer[] = [];
  for (const r of body) {
    const t = Date.parse(r[fetched] ?? "");
    if (!Number.isNaN(t) && t > newest) newest = t;
    offers.push({ provider: r[provider], gpu: r[gpu], usd_hr: Number(r[usd]), kind: r[kind] });
  }
  return { generated_at: Number.isFinite(newest) ? new Date(newest).toISOString() : undefined, offers };
}

/// One CSV line, with RFC 4180 quoting: a quoted field may hold commas and doubled quotes.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/// The newest of the copies that arrived, or throw if even that one is stale. Picking the newest
/// of several stale copies must not make stale data publishable.
export function freshestSnapshot(snapshots: Snapshot[], nowMs: number): Snapshot {
  const dated = snapshots.filter((s) => !Number.isNaN(Date.parse(s.generated_at ?? "")));
  if (dated.length === 0) throw new Error("no feed returned a dated snapshot");
  const newest = dated.reduce((a, b) => (Date.parse(b.generated_at!) > Date.parse(a.generated_at!) ? b : a));
  const ageHours = (nowMs - Date.parse(newest.generated_at!)) / 3_600_000;
  if (ageHours > MAX_SNAPSHOT_AGE_HOURS) {
    throw new Error(`newest snapshot is ${ageHours.toFixed(1)}h old (limit ${MAX_SNAPSHOT_AGE_HOURS}h)`);
  }
  if (ageHours < -1) throw new Error("snapshot is dated in the future");
  return newest;
}

/// Convert a float price to 18-decimal fixed point without going through a lossy string path.
export function toWei(price: number): bigint {
  return BigInt(Math.round(price * 1e9)) * 10n ** 9n;
}
