# First user, traction and what comes next

A note for judges on the two questions the code cannot answer by itself: who uses Ingot first,
and what has been shown so far.

## The first user

**A small neocloud borrowing against a GPU offtake.** Concretely: an operator running a few
hundred to a couple of thousand H100s, with one or more customers signed to 3 to 12 month
capacity contracts, raising debt against that contracted revenue.

Why this operator, and not "crypto traders":

- **It has the exposure.** Its revenue is a GPU-hour rate times hours delivered. When the market
  rate falls, renewals and spot capacity reprice with it.
- **It pays for that exposure on its debt.** Lenders cannot hedge GPU rates, so they price the
  risk into the spread and the advance rate. The same hardware borrows at +225bps against a
  hyperscaler counterparty and +450 to 550bps against a weaker one: that is CoreWeave's own
  borrowing. The difference is cash-flow risk, not hardware risk.
- **It is shut out of the hedge that now exists.** CME's H100 rental index futures (listed
  October 5, 2026) clear through NYMEX and need a futures broker. Most neoclouds are small,
  young and outside the US. They can hold a wallet; they cannot easily open an FCM account.
- **Its rates track the index.** In our data the cheapest neoclouds price 38 to 45% below the
  index but move with it: median tracking error is 3.1% (`docs/BACKTEST.md`). That is what makes
  a basis-ratio hedge work, and it is why `HedgedCredit` sizes the hedge by `offtake × basis`.

**What they get.** In the credit desk's example, a 100,000 GPU-hour offtake at 55% of the index
draws an advance of roughly $140,000, and the lender's recovery is flat at every settlement
price. Unhedged, the same lender needs the rate to fall more than half before it loses, and it
charges for that cushion by advancing less. The hedge removes the cushion, so the borrower can
be offered a larger advance against the same risk appetite.

**The other two sides.**

- **Lender:** a crypto-native credit fund or onchain credit protocol that wants real-world
  revenue exposure without GPU price risk. It funds `HedgedCredit` and underwrites a fixed cash
  flow.
- **Liquidity:** `UnderwriterVault` LPs take the other side of hedges and earn fees and funding.
  NAV is marked to the index continuously, so they see what the book is worth now.

## What has been shown so far

Everything here is public and checkable.

- **A live market on Monad testnet.** Index, market, vault and credit contracts are deployed
  (addresses in `docs/JUDGES.md`). Anyone with a wallet can trade, draw a hedged loan, and
  deposit into the vault at <https://ingotx.vercel.app>.
- **A live index.** The deploy backfilled 78 days of real posted H100 rates. A keeper has
  published a new print every six hours since, built from about 39 quotes across 25 venues, with
  the methodology hash on every print: over 140 prints onchain so far.
- **Real data behind every claim.** The backtest replays those 78 days through the deployed
  contracts, and reports the result that went against us: in that window the hedge changed no
  lender's recovery, because the terms were conservative enough not to need it.
- **A decentralised oracle path.** The Chainlink CRE workflow that fetches and computes the index
  has run end to end in simulation, matching the keeper's print exactly ($3.7216 from 25 venues
  on 2026-10-19). Deployment access to the live network has been requested.
- **Verified end to end.** 116 contract tests, three security reviews with every finding
  recorded, an Envio indexer replayed against the chain to the unit, and a browser test that
  runs all three flows on every push.

<!-- Fill in or delete. Only list what actually happened.
- **Outside testers:** [N] people outside the team have traded or drawn a loan on testnet.
- **Operator conversations:** we have spoken to [role at a type of company, e.g. "the CFO of a
  ~500 GPU European neocloud"] who [what they said or asked for].
- **Community:** the Chainlink integration film was shared in the Monad developer Discord and on X.
-->

## What comes next

1. **Oracle.** Move the index onto the Chainlink DON as soon as deployment access is granted;
   then retire the single publisher key. The receiver contract is already deployed and tested
   against the workflow's own encoder.
2. **One pilot loan.** One operator, one offtake, one hedged loan, on mainnet with real USDC and
   a hard cap on size. The aim is to prove a lender will advance more against a hedged offtake
   than an unhedged one. That is the whole thesis, so it is the first thing to test.
3. **A credit partner.** Bring in one onchain credit fund to fund the pilot and seed the
   underwriter vault, so the hedge has a counterparty from day one.
4. **More of the curve.** Add longer tenors and a B200 index, so operators can hedge the 12 month
   contracts where most of the exposure sits. The current 78-day history cannot speak to those.
