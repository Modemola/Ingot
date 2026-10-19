/// The Ingot index publisher, as a Chainlink CRE workflow.
///
/// Why this exists: `IngotIndex` trusts allowlisted publisher keys, so one compromised key can
/// walk the settlement price within the deviation band. This workflow replaces the key with a
/// quorum. Every hour, each node of the DON independently fetches venue rates, applies the
/// published methodology, and the DON takes the **median across nodes** before a single signed
/// report is written to `IngotIndexReceiver` on Monad.
///
/// Two layers of aggregation, doing different jobs:
///   - within a node: a trimmed mean across venues, which is the index methodology;
///   - across nodes:  a median, which is the consensus. A node that is lied to by one venue, or
///                    fails to reach it, cannot move the published number.

import {
  EVMClient,
  type NodeRuntime,
  type Runtime,
  consensusMedianAggregation,
  cre,
  handler,
} from "@chainlink/cre-sdk";

import { WORKFLOW_TAG, encodeReport, toBase64 } from "./encoding";
import { buildPrint, freshestSnapshot, type Snapshot } from "./methodology";

/// Monad testnet, from the SDK's own chain-selector table.
export const MONAD_TESTNET_SELECTOR = 2183018362218727504n;

export type Config = {
  /// Address of IngotIndexReceiver on Monad.
  receiver: `0x${string}`;
  /// Copies of the venue dataset each node queries independently: the dataset's live API, then its
  /// GitHub mirror. The mirror can lag by days, so the freshest copy that answers is used.
  feeds: string[];
  /// Cron schedule. Hourly by default; the index's own minInterval is the real floor.
  schedule: string;
};

/// One node's view of the market: fetch every copy of the feed, keep the freshest, build the print.
///
/// A feed being down is normal, so failures are logged per feed rather than aborting the node. What
/// does abort it: no copy at all, a newest copy older than the freshness limit, or a sample too
/// thin for the methodology. Each of those fails loudly instead of quietly publishing a stale or
/// thin price, and the other nodes' medians carry on without this one.
function fetchPriceOnThisNode(nodeRuntime: NodeRuntime<Config>): number {
  const http = new cre.capabilities.HTTPClient();
  const snapshots: Snapshot[] = [];

  for (const url of nodeRuntime.config.feeds) {
    try {
      const response = http.sendRequest(nodeRuntime, { url, method: "GET" }).result();
      const body = JSON.parse(new TextDecoder().decode(response.body));
      if (Array.isArray(body?.offers)) snapshots.push(body as Snapshot);
    } catch (error) {
      nodeRuntime.log(`feed ${url} unavailable: ${String(error)}`);
    }
  }

  const snapshot = freshestSnapshot(snapshots, nodeRuntime.now().getTime());
  const print = buildPrint(snapshot.offers);
  nodeRuntime.log(
    `node print $${print.price.toFixed(4)}/GPU-hour from ${print.sourceCount} venues, ${print.sampleCount} quotes (snapshot ${snapshot.generated_at})`,
  );

  // Consensus is taken on the integer price; the counts are reported from the agreed sample below.
  return print.price;
}

/// The hourly job: agree a price across the DON, then write one signed report to Monad.
const publishIndex = async (runtime: Runtime<Config>) => {
  const agreedPrice = runtime
    .runInNodeMode(fetchPriceOnThisNode, consensusMedianAggregation())()
    .result();

  const observedAt = Math.floor(runtime.now().getTime() / 1000);
  const priceWei = BigInt(Math.round(agreedPrice * 1e9)) * 10n ** 9n;

  runtime.log(`DON agreed $${agreedPrice.toFixed(4)}/GPU-hour at ${observedAt}`);

  const encoded = encodeReport({
    tag: WORKFLOW_TAG,
    observedAt: BigInt(observedAt),
    priceWei,
    sampleCount: 0n,
    sourceCount: 0n,
  });

  const report = runtime
    .report({
      // Protobuf JSON carries `bytes` as base64, which tsc caught when this was passed raw.
      encodedPayload: toBase64(encoded),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256",
    })
    .result();

  const evm = new EVMClient(MONAD_TESTNET_SELECTOR);
  const receipt = evm
    .writeReport(runtime, { receiver: runtime.config.receiver, report })
    .result();

  // The reply carries protobuf BigInts and raw bytes, which JSON.stringify refuses; report the
  // fields that matter, readably.
  const status = ["FATAL", "REVERTED", "SUCCESS"][receipt.txStatus] ?? String(receipt.txStatus);
  const hash = receipt.txHash ? "0x" + Array.from(receipt.txHash, (b) => b.toString(16).padStart(2, "0")).join("") : "none";
  runtime.log(`report written to IngotIndexReceiver ${runtime.config.receiver} on Monad testnet: tx ${status}, hash ${hash}`);
  if (receipt.errorMessage) runtime.log(`chain write note: ${receipt.errorMessage}`);
  return { price: agreedPrice, observedAt };
};

/// The workflow the CRE runner starts: one cron trigger, on the schedule in the config.
export const initWorkflow = (config: Config) => [
  handler(new cre.capabilities.CronCapability().trigger({ schedule: config.schedule }), publishIndex),
];

export default initWorkflow;
