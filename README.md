# Ingot

![Ingot: compute, priced & hedged. The H100 index on a split-flap board, and eight GPU providers' prices against one index.](docs/brand/ingot-cover.png)

**A cash-settled market for compute, and hedged credit built on top of it.**

Built for Metropolis: Onchain Finance & Trading track. Live on Monad testnet:
**<https://ingotx.vercel.app>** · five-minute walkthrough in [docs/JUDGES.md](docs/JUDGES.md).

---

## The problem

Compute is one of the most valuable commodities in the world and it trades like a private
handshake. NVIDIA H100 rentals have been observed between **$0.72 and $15.14 per GPU-hour on the
same day** across two dozen marketplaces. There is no forward curve, no hedge, and almost no
secondary market: publicly documented secondary GPU transactions total roughly **$26.3M**.

That missing hedge has a price, and it lands on credit. CoreWeave borrows at **+225bps against a
hyperscaler counterparty and +450 to 550bps against a weaker one, on identical hardware.** The
spread is not hardware risk. It is unhedgeable cash-flow risk, and it is repriced on tens of
billions of dollars of GPU-backed debt.

On **October 5, 2026**, CME lists Silicon Data H100 and B200 Rental Index futures: 730 GPU-hours
per contract, financially settled. Compute is now, officially, a commodity. But that contract is
NYMEX-cleared, FCM-gated and US-regulated: closed to the neoclouds, brokers and AI startups who
actually carry the exposure, across 40+ countries.

## What Ingot is

1. **An index.** An onchain rental-rate index for a standardized compute unit, published with its
   methodology hash, sample count and venue count on every print. Prints are provisional before
   they are settleable, so a bad scrape can be revoked before money moves against it.
2. **A market.** Cash-settled swaps on that index, in CME-parity 730 GPU-hour lots, with liquidity
   underwritten by a vault rather than by hope.
3. **A margin engine** that marks continuously against the index instead of once a day, which is
   only economical at Monad's sub-cent gas and 800ms finality.
4. **Hedged credit.** The part that does not exist anywhere, onchain or off: a loan against compute
   revenue where the offsetting hedge is opened *at origination*, so the lender underwrites a fixed
   cash flow instead of a GPU price forecast. The hedge is not a separate product the borrower has
   to go buy: it is part of the loan.

## Product tour

Captured from the production build against a local chain seeded with the real 78-day index
history.

**The terminal.** The index as published on chain, a ticket that shows the fill, margin, fee and
the on-chain price bound before you sign, and a live position marked against the index.

![The trading terminal: the H100 index chart, an order ticket and an open 25-lot long](docs/screens/trade.jpg)

**The credit desk.** Draw against an offtake and the hedge opens in the same transaction. The
recovery profile on the right is `HedgedCredit.project()` read point by point: the hedged lender
is made whole at every settlement rate; the unhedged one is not.

![The credit desk: origination form beside the lender recovery profile, hedged versus unhedged](docs/screens/credit.jpg)

**One transaction.** What `HedgedCredit.open()` does before the block closes. If any step fails,
none of them happened.

![Sequence diagram of HedgedCredit.open: margin posted, short opened, vault fills, principal paid](docs/screens/one-transaction.jpg)

## Trying it

[**docs/JUDGES.md**](docs/JUDGES.md) is the five-minute walkthrough: test funds, the three
flows, and how to check each claim against the chain or the test suite. No login, no setup beyond
a wallet and testnet gas.

## Documentation

| | |
|---|---|
| [`docs/JUDGES.md`](docs/JUDGES.md) | Five-minute walkthrough for judges |
| [`docs/FIRST-USER.md`](docs/FIRST-USER.md) | The first user, what has been shown so far, and what comes next |
| [`docs/BACKTEST.md`](docs/BACKTEST.md) | 78 days of real H100 prices: method, findings, and the negative result |
| [`docs/SECURITY.md`](docs/SECURITY.md) | What the protocol trusts, what was fixed, what was accepted |
| [`docs/ORACLE.md`](docs/ORACLE.md) | The index publisher as a Chainlink CRE workflow |
| [`docs/INDEXER.md`](docs/INDEXER.md) | The Envio HyperIndex data layer, and how it is proven against the contracts |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Deploying contracts and hosting the front end |
| [`docs/VIDEO-SCRIPTS.md`](docs/VIDEO-SCRIPTS.md) | Demo and pitch scripts |
| [`docs/brand/`](docs/brand) | Logo, cover, mark and the script that renders them |

## Architecture

```
 GPU rental prices (25+ venues, public dataset)
        │
        ├── keeper, every six hours (GitHub Actions, tools/publish-index.mjs)
        └── Chainlink CRE workflow: each node computes the index, the DON agrees a median
        ▼
 IngotIndex            the onchain rate: provisional, then final; deviation band, revocation
        ▼
 IngotMarket           cash-settled swaps in 730 GPU-hour lots, margin marked to the index
   ▲         ▲
   │         └── UnderwriterVault   LPs take the other side of every trade
   │
 HedgedCredit          a loan against compute revenue that opens its own hedge, in one transaction
        │
        ▼ events
 Envio indexer  ──►  Next.js front end (reads the chain directly, and the indexer for history)
```

The trade, credit and underwrite screens take every number from a contract call or an indexed
event. The landing page's history charts draw on the published 78-day dataset behind the backtest.

## Technology stack

| Layer | Tools |
|---|---|
| Contracts | Solidity 0.8.30, Foundry, OpenZeppelin Contracts |
| Oracle | Chainlink CRE (TypeScript SDK), plus a Node keeper on GitHub Actions |
| Data | Envio HyperIndex (GraphQL) |
| Front end | Next.js, React, wagmi, viem, TanStack Query, three.js with React Three Fiber, Motion |
| Hosting | Vercel (site), GitHub Actions (keeper, CI, deploys) |
| Chain | Monad testnet (chain 10143) |

## Monad integration

All of Ingot's contracts are deployed on Monad testnet; addresses are in
[docs/JUDGES.md](docs/JUDGES.md#contract-addresses) and `contracts/deployments/10143.json`. The index
has published a new print onchain every six hours since deployment, on top of the 78-day history
the deploy backfilled.

Why Monad: the margin engine marks every position against the index continuously rather than once
a day, the keeper and the CRE workflow publish on a schedule, and `HedgedCredit.open()` posts
margin, opens the short, fills it against the vault and pays out the principal in a single
transaction. That pattern is many small, frequent writes that must settle quickly, which is what
sub-cent gas, 400ms blocks and 800ms finality make practical. On the front end it means a trade
shows its fill instead of a pending state.

## Repository layout

```
contracts/      Foundry workspace: index, market, vault, credit
  src/          Contracts
  test/         Test suite
  script/       Deployment and seeding
web/            Next.js front end: terminal, credit desk, underwriter vault
oracle/         Chainlink CRE workflow that publishes the index by DON consensus
indexer/        Envio HyperIndex indexer: trades, both sides of every position, loans, history
tools/          Index construction, basis analysis, scheduled publisher, brand renderer (tools/brand)
scripts/        One-command deploy
docs/           Judge walkthrough, deploy, backtest, security model, oracle, indexer
  brand/        Logo, cover and mark
  hackathon/    Track briefs and resource index
```

## Running the front end

```bash
cd web
pnpm install
node scripts/abis.mjs        # regenerate ABIs after a contract change
node scripts/addresses.mjs   # pick up contracts/deployments/<chainid>.json
pnpm dev
```

With no wallet connected the app reads the first chain it is deployed to, so the market renders
before anyone connects.

## Status

| Component | State |
|---|---|
| `IngotIndex`: index oracle | Built, 22 tests passing |
| `IngotMarket`: swaps, margin, settlement, liquidation | Built, 33 tests passing |
| `UnderwriterVault`: LP accounting over the vault account | Built, 12 tests passing |
| `HedgedCredit`: loans with auto-hedge | Built, 29 tests passing |
| `IngotIndexReceiver`: CRE workflow landing pad | Built, 12 tests passing |
| Envio indexer: replayed against a recorded contract session | Built, 9 tests passing |
| Front end: terminal, credit desk, underwriter vault | Built, builds clean |
| End-to-end: trade, credit and underwrite driven through the UI against a fresh chain | 3 flows passing in CI (`scripts/e2e.sh`) |
| Backtest over historical rental data | Replayed over 78 days, 3 tests passing |
| Deploy seed: the real 78-day index history, on chain | Built, 4 tests passing |
| Keeper: index prints every six hours; lists, settles and realizes contracts as months roll | Built, 17 tests passing |

118 contract tests, 9 indexer tests, 17 keeper tests (index publisher and contract calendar) and 3 end-to-end browser flows, all passing. Three security reviews; every finding is in [docs/SECURITY.md](docs/SECURITY.md) with the test that pins it. Deployed to Monad testnet; addresses in [docs/JUDGES.md](docs/JUDGES.md#contract-addresses).

## The number that makes the case

A 100,000 GPU-hour monthly offtake, hedged at $2.48/hr, financed at 70% LTV: $175,000 of
principal, $183,750 of debt, $60,000 of borrower margin. Recovery by settlement price, straight
out of `HedgedCredit.project()`:

| Settlement rate | Hedged recovery | Unhedged recovery |
|---|---|---|
| $0.80/hr | $183,750 | $140,000 |
| $1.20/hr | $183,750 | $180,000 |
| $1.80/hr and above | $183,750 | $183,750 |

At $0.80/hr the unhedged lender is down $43,750: a quarter of the principal. That is not a
contrived stress case: H100 listings have been observed between $0.72 and $15.14 per GPU-hour on
the same day.

Reproduce it with `forge test --match-test test_demo_projectionTable -vv`.

## Local development

Foundry and solc are pinned; the index oracle builds and tests offline.

```bash
cd contracts
forge build
forge test
```

### If `pnpm install` refuses to run

pnpm 12 enforces a minimum release age on every entry in the lockfile, and will fail the whole
install if any transitive dependency was published too recently:

```
ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION
```

That is the supply-chain policy doing its job, not a defect here: the offending package is
usually `electron-to-chromium`, a Chromium version-mapping data package reached through
`next → browserslist`, which publishes most days. Deleting and regenerating the lockfile does not
help: pnpm re-resolves to the same release and rejects it again.

It clears once the package ages past the window. To install before then, add `minimumReleaseAge: 0`
to `web/pnpm-workspace.yaml` for that one run and take it out afterwards, rather than leaving the
check disabled for everything.

## Build window and originality

Ingot was built from scratch during the hackathon: the first commit is dated 21 September 2026 and
the full history is in this repository. No pre-existing product or codebase was used as a
foundation; the external code is limited to the open libraries and data credited below.

## AI assistance

AI coding tools were used to build this project, as the hackathon rules permit: Claude Code
(Anthropic) assisted with writing code, tests and documentation. The product, its design and the
decisions behind it are the team's.

## Credits

Libraries and data this project builds on, each under its own license:

| What | Used for | License |
|---|---|---|
| [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) | Ownable, ReentrancyGuard, SafeERC20, SafeCast, ERC165; ERC20 for the test USDC | MIT |
| [forge-std](https://github.com/foundry-rs/forge-std) / [Foundry](https://github.com/foundry-rs/foundry) | Tests, scripts, deployment | MIT / Apache-2.0 |
| [Chainlink CRE SDK](https://www.npmjs.com/package/@chainlink/cre-sdk) and CLI | The oracle workflow; `IReceiver` follows Chainlink's interface | BUSL-1.1 |
| [Envio HyperIndex](https://envio.dev) | The indexer | Envio license |
| [Next.js](https://nextjs.org), [React](https://react.dev) | Front end | MIT |
| [wagmi](https://wagmi.sh), [viem](https://viem.sh), [TanStack Query](https://tanstack.com/query) | Wallet and chain access | MIT |
| [three.js](https://threejs.org), [React Three Fiber](https://github.com/pmndrs/react-three-fiber), drei, [postprocessing](https://github.com/pmndrs/postprocessing) | 3D scenes | MIT / Zlib |
| [Motion](https://motion.dev), [Lenis](https://github.com/darkroomengineering/lenis) | Animation and scrolling | MIT |
| [Geist](https://vercel.com/font), [Newsreader](https://fonts.google.com/specimen/Newsreader) | Typefaces | SIL OFL 1.1 |
| [Remotion](https://www.remotion.dev) | Rendering the videos in `video/` | Remotion license |
| [gpu-rental-prices](https://github.com/adriannutiu/gpu-rental-prices) by Adrian Nutiu | Daily H100 rental snapshots behind the index and the backtest | CC BY 4.0 |

## License

Ingot's own code is released under the [MIT License](LICENSE). Third-party libraries and data keep
their own licenses, listed above.
