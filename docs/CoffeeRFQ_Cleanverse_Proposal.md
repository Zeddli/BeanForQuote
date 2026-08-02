# CoffeeRFQ — Compliant Price Discovery for Physical Commodity RWAs

**Cleanverse Build: Trusted Assets Hackathon — RWA Track**

---

## One-line pitch

An RFQ-based settlement layer for tokenized coffee, where verified exporters and roasters trade CVA-wrapped commodity tokens against signed quotes from verified market makers — instead of against a shallow AMM pool that was never designed for a long-tail physical asset.

---

## The Problem

Coffee moves through a chain of intermediaries — cooperative, exporter, importer, roaster — each step adding settlement delay, correspondent-banking cost, and FX friction. Tokenizing coffee on-chain solves the *representation* problem, but most RWA tokenization projects stop there and bolt on an AMM pool for trading. That's the wrong mechanism for this asset class:

- Coffee-token liquidity will always be thin. Pricing it off a bonding curve produces slippage that no real exporter or roaster would accept for a container-sized trade.
- Physical commodities need negotiated, inventory-aware pricing (quality grade, origin, harvest timing) — closer to how coffee is actually priced OTC today — not a constant-product curve.
- Cross-border trades between a cooperative and a roaster carry real compliance obligations (Travel Rule, sanctions screening, jurisdictional restrictions) that a permissionless pool cannot enforce.

**CoffeeRFQ addresses all three by pairing an RFQ execution model with Cleanverse's compliance-native asset layer.**

---

## The Solution

### How it works, end to end

1. **Issuance.** A verified exporter (CVI-verified via A-Pass) deposits or originates coffee inventory and mints CVA-wrapped tokens (`cvCOFFEE`) representing a specific lot — origin, grade, quantity, harvest date encoded as token metadata. Tokens are non-redeemable outside the Cleanverse-verified wallet set, per the standard A-Token model.
2. **Quote request.** A verified buyer (roaster or importer) submits an RFQ: lot ID, quantity, direction. This request is only visible to CVI-verified market makers who hold an active A-Pass and are permitted to quote under the relevant jurisdictional rules.
3. **Quoting.** Market makers (in the hackathon demo: 2–3 scripted bots pricing off simulated inventory and a reference commodity price feed) respond with signed, time-boxed quotes (30–60s validity), mirroring how 0x/Hashflow-style RFQ networks work today.
4. **Pre-trade compliance check.** Before a quote can be accepted, the CCP (Cleanverse Compliance Protocol) runs a live rule check on *both* counterparties — not just at onboarding — covering sanctions status, jurisdiction pairing, and transfer eligibility for that specific `cvCOFFEE` lot.
5. **Settlement.** The taker signs the best quote; the trade settles atomically against the maker's `cvCOFFEE`/stablecoin inventory. Travel Rule data is attached automatically and an audit-ready report is generated for both parties.
6. **Continuous enforcement, not a one-time gate.** A-Pass status, jurisdiction rules, and per-lot transfer restrictions are re-checked at every step (request, quote, settlement) — so a revoked or expired credential blocks the *next* action, not just the first login.

### Why Monad

Quote validity windows are short by design (30–60 seconds). Fast block finality matters here in a way it doesn't for most DeFi flows: a maker's quote that expires before settlement confirms is a failed trade and reputational cost to the network. Monad's throughput and finality characteristics are used specifically to keep the request → quote → settle loop inside that validity window even under concurrent RFQ traffic — not as a default deployment target.

---

## Pilot Story (used in the demo)

Two named fictional counterparties, walked through one real transaction:

- **Finca Verde Cooperative** (Huila, Colombia) — exporter, holds A-Pass, mints `cvCOFFEE` for a 500-bag lot of washed Caturra.
- **Nordlicht Roasters** (Hamburg, Germany) — importer/roaster, holds A-Pass, submits an RFQ for the full lot.
- Three market-maker bots quote against the request; Nordlicht accepts the best price; CCP clears the cross-border check; settlement completes with Travel Rule data attached; both parties can pull an audit-ready report.

This is used instead of an abstract "marketplace" UI so judges see one complete, believable trade rather than a feature list.

---

## Scope for the 48-Hour Build

**Built and demoed live:**
- `cvCOFFEE` issuance via CVA, with lot-level metadata and transfer restrictions
- CVI gating enforced at every step of the RFQ flow (request, quote, settlement) — not just at onboarding
- Working RFQ loop: request → 2–3 bot quotes → accept → atomic settlement
- CCP pre-trade compliance check running per-transaction, with an audit-report output
- Deployed on Monad testnet

**Explicitly mocked, and stated as such in the demo:**
- Physical custody / proof-of-reserve for the coffee itself (warehouse receipt or oracle attestation) — we show the integration point where a custody oracle would plug in, but do not build the oracle
- Market-maker pricing logic is a simplified inventory model, not a production pricing engine
- Fiat on/off-ramp (Gateway Network) is referenced conceptually, not integrated

We're stating the cut points up front rather than implying they're solved, since that's a more credible position under judge Q&A than overselling scope.

---

## Cleanverse Integration Plan (for the application form)

| Layer | Used for |
|---|---|
| **CVI** | Gating who can mint, request quotes, respond as a maker, and settle. Re-checked at every action, not just onboarding. |
| **CVA** | Wrapping the coffee lot as a non-redeemable, transfer-restricted token; enforcing that it only moves between verified wallets. |
| **CCP Protocol** | Per-transaction rule checks (sanctions, jurisdiction pairing, per-lot restrictions) before a quote can be accepted; Travel Rule data generation on settlement. |
| **Sandbox / API** | CVI and CVA endpoints called directly from the RFQ request/quote/settlement flow (not simulated). |

---

## Judging Criteria Alignment

- **Concept & Problem Definition** — RFQ is the mechanically correct execution model for a long-tail physical asset; positioned as B2B settlement infrastructure, not retail speculation.
- **Depth of CVI·CVA Integration** — enforcement happens at every step of the flow, not a single onboarding gate.
- **Build Quality** — scope is deliberately narrowed to one real, working loop (issuance → RFQ → compliant settlement) rather than a broad, shallow feature set.
- **UX & Demo** — one named, complete transaction between two fictional counterparties, told end to end.
- **Scalability Potential** — Monad's finality is tied to a concrete requirement (quote validity windows), with a stated path to production custody oracles and Gateway Network fiat integration.

---

## Post-Hackathon Path

If selected for incubation: integrate a real warehouse-receipt oracle (starting with a single pilot cooperative), connect Gateway Network for fiat settlement, and expand market-maker participation beyond scripted bots to real liquidity providers already active in Cleanverse's RFQ-adjacent partner network.
