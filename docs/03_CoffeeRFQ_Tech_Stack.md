# CoffeeRFQ — Tech Stack

Sized for a 48-hour build. Every choice below optimizes for iteration speed over production polish, with a stated cut order if time runs short.

---

## Chain layer

| Item | Value |
|---|---|
| Network | Monad Testnet |
| Chain ID | 10143 |
| RPC URL | `rpc.testnet.monad.xyz` |
| Explorer | `testnet.monadscan.com` |
| Gas token | MON (faucet-funded, effectively free on testnet) |
| EVM compatibility | Full bytecode compatibility — no rewrites needed; standard Solidity tooling applies directly |

Monad targets roughly 1-second block times and high throughput, which is the actual justification for using it here: quote validity windows are short (30–60s), and fast finality keeps the request → quote → settle loop reliably inside that window even under concurrent RFQ traffic. That's the one place chain choice materially affects the product, not a decorative deployment target.

---

## Smart contract layer

- **Solidity** — standard choice, matches the ERC-1155-style `CoffeeLotToken` design (see `04_Smart_Contracts_Architecture.md`)
- **Foundry** — faster local iteration than Hardhat for a time-boxed build (`forge test` for fast unit tests, `forge script` for scripted deploys); officially supported on Monad alongside Hardhat and Remix
- **OpenZeppelin Contracts** — ERC-1155 base and `AccessControl` primitives; CVI role checks layer on top rather than reinventing access control

---

## Cleanverse integration layer

The area with the most uncertainty, since no public API/SDK spec is available yet.

- Interface contracts (`ICleanverseCVI`, `ICleanverseCVA`) so core contracts compile and test independently of Cleanverse's endpoint being live
- A thin off-chain adapter service (Node/Express) if CCP compliance checks are REST/API-based rather than on-chain-callable — likely, given CCP is described as a policy engine rather than a contract
- **Build order:** get contracts working against a mocked CVI/CVA interface first; swap in the real hackathon sandbox endpoint once access is confirmed. Don't block core RFQ logic on Cleanverse API access being sorted out.

---

## Off-chain services

- **Market maker bots** — Node.js scripts listening for `RFQSubmitted` events over WebSocket RPC, responding with `submitQuote()` calls per the pricing model in `02_RFQ_Engine_and_Pricing.md`. Kept intentionally simple — a demo prop, not a pricing engine.
- **Event indexer** — a lightweight Node service polling or subscribing to contract events, writing to SQLite or Postgres. Skip subgraph tooling entirely; the deployment overhead isn't worth it for a 48-hour build.

---

## Frontend

- **Next.js + wagmi + viem** — standard modern EVM stack; viem talks to Monad exactly like any EVM chain
- **RainbowKit or ConnectKit** — wallet connection UI, off the shelf
- Scope strictly to the pilot-story screens (full breakdown in `05_Screen_Designs.md`) — mint, RFQ request, quote comparison, compliance/settlement confirmation, audit trail view

---

## Testing & deployment

- `forge test` for contract logic — attestation-gated minting, RFQ state transitions, freeze/flag enforcement. These are exactly the behaviors judges are likely to probe, so real passing tests matter more here than UI polish.
- Deploy to Monad testnet via `forge script`; verify contracts on Monadscan so judges can inspect them directly — low effort, real credibility signal
- Testnet faucet for MON gas — no cost concern during the build

---

## Cut order if time runs short

1. Drop the event indexer first — poll directly from the frontend via viem instead
2. Drop RainbowKit second — a bare wagmi connect button is enough
3. Drop bot pricing sophistication third — flat prices with small random jitter still demonstrate the mechanism
4. **Never cut contract tests** — a broken demo is recoverable live; a compliance check that silently doesn't gate anything is the kind of gap that surfaces in Q&A and undermines the entire integration-depth story
