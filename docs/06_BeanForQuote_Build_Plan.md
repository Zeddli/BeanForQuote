# BeanForQuote — Build Plan

## Objective

Deliver a hackathon-ready MVP for **BeanForQuote / CoffeeRFQ**: an RFQ-based settlement layer for tokenized coffee on **Monad testnet**, with deep and visible integration into the **Cleanverse** stack:

- **CVI** for role and wallet verification
- **CVA** for compliant coffee-lot tokenization
- **CCP Protocol / Validator Compliance** for pre-transaction rule checks
- **Playground** for rule validation and audit-report demonstration
- **API / SDK** for live integration paths
- **Gateway Network** and **Clean Payment Rails** referenced as follow-on integrations
- **Agent Skill Framework** positioned as future programmable mandate execution

This plan is designed to align with the current project docs and with the Cleanverse cooperate API constraints documented in `docs/CleanVerseDocs.md`.

---

## 1. Product scope

## 1.1 MVP statement

Build one complete, believable trade loop:

1. Exporter is verified via **A-Pass / CVI**
2. Exporter mints a **CVA-wrapped coffee lot token** (`cvCOFFEE`)
3. Buyer submits an **RFQ**
4. Verified makers respond with **signed quotes**
5. Buyer accepts the best executable compliant quote
6. **CCP / validator rule check** runs before settlement
7. Settlement executes atomically on **Monad testnet**
8. Audit-ready trade output is generated

## 1.2 What is in scope

- Role-gated flow for:
  - Exporter
  - Buyer
  - Market Maker
  - Regulator
  - Auditor
- RFQ lifecycle:
  - request
  - quote
  - accept
  - settle
- Coffee lot token with:
  - lot metadata
  - transfer restrictions
  - verified-wallet gating
- Cleanverse-backed identity and compliance checks
- Demo UI for the named pilot flow
- Monad deployment and contract verification
- Basic tests covering compliance and RFQ flow

## 1.3 What is explicitly out of scope

- Real warehouse receipt oracle
- Real fiat on/off-ramp execution
- Real institutional payment settlement via Gateway / payment rails
- Production-grade maker pricing engine
- Multi-leg trade finance
- Real legal title transfer framework for commodity custody

These should be stated clearly in the demo.

---

## 2. System architecture plan

This plan follows the architecture already defined in:

- `docs/01_CoffeeRFQ_Overall_Architecture.md`
- `docs/02_CoffeeRFQ_RFQ_Engine_and_Pricing.md`
- `docs/04_CoffeeRFQ_Smart_Contracts_Architecture.md`

## 2.1 Core layers

### On-chain on Monad
- `CoffeeLotToken`
- `RFQEngine`
- `SettlementEngine`
- `RuleEngine`
- `AuditLog`
- optional:
  - `AttestationRegistry`
  - `CustodyRegistry`

### Off-chain services
- Cleanverse adapter service
- Market maker bot service
- Event indexer or direct frontend reads

### Frontend
- Role-based workflow screens
- Wallet connection
- Quote comparison and settlement confirmation
- Audit view

### External systems
- Cleanverse cooperate API sandbox
- Monad testnet RPC and explorer

---

## 3. Cleanverse integration plan

## 3.1 CVI / A-Pass integration

### Goal
Ensure only verified wallets can participate in the RFQ flow.

### Usage in BeanForQuote
- Exporter must hold valid A-Pass
- Buyer must hold valid A-Pass
- Market Maker must hold valid A-Pass
- Regulator and Auditor roles must be mapped to verified wallets in demo scope

### Expected API path
Use Cleanverse cooperate API for:
- `POST /generate_apass`
- `POST /query_apass`
- related A-Pass query flows as needed

### Important implementation notes
From `docs/CleanVerseDocs.md`:
- requests like `generate_apass` require **AES-encrypted** request bodies
- requests need `api-id`
- wallet `chain` supports `monad`
- identity documents include `issuingCountryISO2`, which can later support jurisdictional rule checks

### MVP implementation choice
- Build a server-side adapter that:
  - encrypts outbound requests
  - stores no raw PII in frontend
  - returns only status and role eligibility to app services
- For demo, use pre-generated wallets for:
  - Finca Verde Cooperative
  - Nordlicht Roasters
  - 2–3 maker wallets
  - regulator/auditor demo wallets

---

## 3.2 CVA / A-Token integration

### Goal
Represent coffee lots as compliant, transfer-restricted assets.

### Usage in BeanForQuote
- Mint `cvCOFFEE` lot token
- Restrict transfers to verified wallets only
- Associate metadata:
  - lot ID
  - origin
  - grade
  - quantity
  - harvest date

### Expected API path
Use A-Token / wrapped A-Token flows such as:
- `POST /atoken/register_wrapped_atoken`
- `POST /atoken/launch_wrapped_atoken`
- `POST /atoken/add_rule`
- `POST /atoken/set_paused`
- `GET /atoken/list_my_atokens`

### Important implementation notes
- many A-Token write endpoints require **AES-encrypted** request bodies
- country-based allow/deny rules are supported
- pause / whitelist / rule management is available
- rule changes should wait for prior writes to confirm

### MVP implementation choice
- Treat Cleanverse CVA as the source of compliance semantics
- Mirror those checks in local contract logic where needed for demo determinism
- Use lot-level token metadata and transfer eligibility checks as the visible “CVA depth” story

---

## 3.3 CCP Protocol / Validator Compliance integration

### Goal
Run a transaction-scoped compliance decision before quote acceptance and settlement.

### Usage in BeanForQuote
- Check buyer ↔ maker compatibility
- Check lot transfer eligibility
- Check country/jurisdiction conditions
- Produce auditable pass/fail result

### Expected API path
Validator-related endpoints likely used:
- `POST /validator/register`
- `POST /validator/set_rule`
- `POST /validator/add_rule`
- `POST /validator/verify`
- `POST /validator/is_paused`
- `POST /validator/rules`

### Important implementation notes
From the docs:
- validator write endpoints are encrypted
- validator read endpoints like `verify` are plain JSON
- `verify` may return HTTP 200 even when `valid` is false
- country allow/deny rules are supported
- paused pools affect verification behavior

### MVP implementation choice
- Build compliance as a two-step architecture:
  1. off-chain Cleanverse validator/CCP check through adapter
  2. on-chain transfer gate in `RuleEngine` / `CoffeeLotToken`
- This supports the project thesis that compliance is enforced:
  - before execution
  - at the asset-transfer layer

---

## 3.4 Playground integration

### Goal
Demonstrate that rules and transaction flows can be inspected and validated in a compliance workbench.

### MVP usage
- Show that the jurisdiction rules used in the demo match what is configured in Playground / validator setup
- Generate or present audit-ready artifacts tied to the settlement flow

### Demo note
If direct Playground embedding is not feasible:
- reference it as the compliance design and validation layer
- show exported rule outputs / screenshots / structured report view

---

## 3.5 API / SDK integration

### Goal
Make Cleanverse usage real, not merely conceptual.

### Adapter service responsibilities
- add `api-id`
- perform AES encryption/decryption for required endpoints
- normalize response shapes
- expose internal app endpoints like:
  - `/api/cvi/status`
  - `/api/cva/mint`
  - `/api/ccp/check`
  - `/api/audit/report`

### Security note
- never expose `api-key` in frontend
- all encryption must happen server-side

---

## 3.6 Gateway Network and Clean Payment Rails

### MVP position
These should be included in the architecture and future-state plan, but not fully integrated unless time permits.

### Demo framing
- current settlement uses testnet stablecoin inventory and atomic on-chain transfer
- future version connects:
  - fiat on/off-ramp quote flow
  - clean stablecoin routing
  - escrow-style settlement guarantees

### Why mention them
Because they strengthen the path from demo to institutional workflow, even if not built in 48 hours.

---

## 3.7 Agent Skill Framework

### MVP position
Do not make this a core dependency.

### Best usage
Position it as a post-hackathon extension:
- buyer mandate agents
- quoting policy agents
- treasury or procurement execution mandates
- pre-approved spend and counterparty controls

This is strategically useful, but not necessary to prove the RFQ settlement core.

---

## 4. Monad integration plan

## 4.1 Network usage

Deploy to:
- **Monad Testnet**
- chain ID `10143`
- RPC `rpc.testnet.monad.xyz`

## 4.2 Why Monad matters in this project

Monad should be framed as an enabler, not the entire thesis:
- short quote validity windows
- fast settlement confirmation
- lower risk of quote expiry during acceptance
- smooth demo performance under multiple maker bots

## 4.3 Deliverables
- contracts deployed to Monad testnet
- addresses documented in repo
- explorer links ready for demo

---

## 5. Smart contract implementation plan

This should follow `docs/04_CoffeeRFQ_Smart_Contracts_Architecture.md` closely.

## 5.1 Priority contract set

### Must-have
1. `CoffeeLotToken`
2. `RFQEngine`
3. `SettlementEngine`
4. `RuleEngine`
5. `AuditLog`

### Nice-to-have
6. `AttestationRegistry`
7. `CustodyRegistry`

## 5.2 Suggested simplification for hackathon
If time is tight:
- collapse `AttestationRegistry`, `CustodyRegistry`, and `RuleEngine` into a smaller combined registry contract
- preserve external behavior, not internal purity

## 5.3 Required behaviors

### `CoffeeLotToken`
- mint lot token
- store or reference metadata
- restrict transfer to compliant wallets
- re-check transfer eligibility at transfer time

### `RFQEngine`
- submit RFQ
- submit quote
- enforce expiries
- ensure only buyer accepts own RFQ
- call pre-trade compliance check

### `SettlementEngine`
- atomic swap:
  - maker sends `cvCOFFEE`
  - buyer sends stablecoin
- write trade result to `AuditLog`

### `RuleEngine`
- maintain:
  - wallet flags
  - lot freezes
  - jurisdiction rules
- expose `checkCompliant(...)`

### `AuditLog`
- store:
  - buyer
  - maker
  - lot
  - price
  - timestamp
  - travel rule or compliance reference data

---

## 6. Off-chain service plan

## 6.1 Cleanverse adapter service

### Responsibilities
- encrypt/decrypt Cleanverse API payloads
- map app roles to A-Pass status
- run compliance verification checks
- generate audit report payloads

### Suggested stack
- Node.js
- Express or Fastify
- small service module structure:
  - `cleanverseClient.ts`
  - `aes.ts`
  - `cviService.ts`
  - `cvaService.ts`
  - `validatorService.ts`

---

## 6.2 Market maker bot service

### Goal
Provide visible and believable competitive quotes.

### Bot logic
Per `docs/02_CoffeeRFQ_RFQ_Engine_and_Pricing.md`:
- reference price
- base spread
- inventory skew
- quote expiry window

### Bot count
- 2–3 bots is enough

### Outputs
- submit quotes to `RFQEngine`
- expose debug trace for demo:
  - reference price
  - spread
  - inventory
  - final quote

---

## 6.3 Indexer or direct reads

### Preferred
Use direct reads first to reduce complexity.

### If needed
Add a lightweight indexer for:
- RFQ events
- quote events
- settlement events
- audit history

### Cut rule
Indexer is first feature to cut if time is constrained.

---

## 7. Frontend plan

This should align with `docs/05_CoffeeRFQ_Screen_Designs.md`.

## 7.1 MVP screens to build first

### Priority 1
1. Exporter mint lot
2. Buyer RFQ and quote comparison
3. Settlement confirmation
4. Auditor trade detail view

### Priority 2
5. Quality inspector attestation
6. Regulator rule / freeze screen

### Priority 3
7. Custodian update screen
8. Maker debug feed

## 7.2 UI goals
- keep the story concrete
- show role gating clearly
- make quote expiry visible
- make compliance result visible
- make Monad transaction and audit outputs visible

## 7.3 Demo actors
Use named pilot entities:
- Finca Verde Cooperative
- Nordlicht Roasters
- Maker A / B / C

That is much stronger than generic placeholder roles.

---

## 8. Build phases

## Phase 0 — Setup
- initialize environment variables
- configure Monad testnet RPC
- prepare demo wallets
- confirm Cleanverse sandbox credentials if available

## Phase 1 — Contract core
- implement `CoffeeLotToken`
- implement `RFQEngine`
- implement `SettlementEngine`
- implement `RuleEngine`
- deploy locally / test
- write unit tests

## Phase 2 — Cleanverse adapter
- implement AES utilities
- wire `generate_apass`
- wire validator verify / rule flows
- stub CVA calls if sandbox blocks progress
- normalize role/compliance API responses

## Phase 3 — RFQ bots
- listen to RFQ events
- compute quote price
- submit quotes
- support expiry and inventory parameters

## Phase 4 — Frontend demo path
- wallet connection
- mint lot screen
- RFQ screen
- quote acceptance screen
- settlement status screen
- audit report screen

## Phase 5 — Integration hardening
- connect frontend to real adapter service
- run end-to-end flow on Monad testnet
- validate fail states:
  - expired quote
  - frozen lot
  - flagged wallet

## Phase 6 — Demo preparation
- seed demo data
- prepare one success flow
- prepare one blocked compliance flow
- document contract addresses and tx links

---

## 9. Work breakdown by module

## 9.1 Smart contracts
- define data models
- implement state transitions
- enforce expiries
- enforce role gating
- log settlement details

## 9.2 Backend / adapter
- AES encryption wrapper
- Cleanverse client
- A-Pass registration/query handling
- validator compliance handling
- audit artifact formatting

## 9.3 Frontend
- role-aware layout
- screens for pilot flow
- transaction status feedback
- quote timers
- audit viewer

## 9.4 Demo / operations
- funded Monad wallets
- sample lot metadata
- market maker inventories
- stablecoin balances
- test scripts

---

## 10. Validation plan

## 10.1 Contract tests
Must cover:
- mint blocked without attestation or authorization
- RFQ lifecycle transitions
- expired quote rejection
- only RFQ owner can accept
- frozen lot blocks quote/settlement
- flagged wallet blocks transfer
- settlement records audit log

## 10.2 Integration tests
- A-Pass status lookup
- validator verify happy path
- validator deny path
- encrypted endpoint request handling

## 10.3 Demo acceptance criteria
The MVP is complete if you can show:

1. verified exporter wallet
2. mint of coffee lot token
3. buyer RFQ creation
4. 2–3 live quote submissions
5. compliance pass before settlement
6. atomic settlement on Monad
7. audit record visible afterward

Bonus:
- failed trade due to freeze or rule denial

---

## 11. Risks and mitigations

## Risk 1 — Cleanverse API uncertainty
### Mitigation
- build against mock interfaces first
- isolate all external calls in adapter layer
- keep contract design independent of exact endpoint quirks

## Risk 2 — encrypted API integration complexity
### Mitigation
- implement AES utility early
- verify one encrypted endpoint first
- keep requests server-side only

## Risk 3 — too many contracts
### Mitigation
- collapse auxiliary registries if needed
- preserve core RFQ + compliance transfer path

## Risk 4 — UI overreach
### Mitigation
- only polish the live demo path
- keep admin screens minimal

## Risk 5 — unclear legal meaning of token
### Mitigation
- state explicitly in demo and docs:
  - hackathon token represents a compliant digital transfer record tied to a coffee lot in a closed pilot context
  - custody oracle and legal title framework are future work

---

## 12. Messaging plan for judges

## Core thesis
Coffee does not want an AMM. It wants:
- negotiated pricing
- inventory-aware quotes
- verified counterparties
- transaction-level compliance
- atomic settlement

## Cleanverse depth story
The strongest sponsor-fit message is:

- **CVI** gates who may act
- **CVA** constrains how the asset may move
- **CCP / validator rules** decide whether a specific trade may execute
- **Playground / reporting** make the result auditable
- **Monad** makes short-validity RFQ settlement practical

## Demo line
“BeanForQuote is not a coffee memecoin marketplace. It is a compliant RFQ settlement rail for illiquid tokenized commodity lots.”

---

## 13. Deliverables to create in repo

Recommended new or completed project artifacts:

- `docs/06_BeanForQuote_Build_Plan.md`
- `docs/07_Demo_Runbook.md`
- `docs/08_Judge_QA.md`
- `contracts/`
  - `CoffeeLotToken.sol`
  - `RFQEngine.sol`
  - `SettlementEngine.sol`
  - `RuleEngine.sol`
  - `AuditLog.sol`
- `server/`
  - Cleanverse adapter service
- `bots/`
  - market maker quote bots
- `app/` or `frontend/`
  - role-based demo UI

---

## 14. Recommended implementation order

1. `RuleEngine`
2. `CoffeeLotToken`
3. `RFQEngine`
4. `SettlementEngine`
5. `AuditLog`
6. contract tests
7. Cleanverse adapter
8. maker bots
9. frontend demo flow
10. audit and failure-state polish

---

## 15. Definition of done

BeanForQuote is ready for submission when:

- the full pilot flow runs on Monad testnet
- Cleanverse-backed identity/compliance checks are visibly integrated
- a buyer can receive multiple quotes and accept one
- settlement transfers tokenized coffee lot and payment atomically
- an audit-ready record is available
- the demo clearly distinguishes:
  - what is built
  - what is mocked
  - what is the post-hackathon path
