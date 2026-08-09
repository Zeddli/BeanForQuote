# BeanForQuote / CoffeeRFQ Hackathon Demo Runbook

## Goal

Show a live, end-to-end RFQ settlement flow for tokenized coffee on Monad testnet:

- **Identity-gated access** via Cleanverse `CVI / A-Pass`
- **Tokenized asset** via `CVA / A-Token` wrapping a real coffee lot
- **Competitive RFQ pricing** from `2–3 maker bots`
- **Compliance validation** via `CCP / validator checks`
- **Atomic-style settlement outcome** with **audit-ready output**

**Pilot story:**  
Finca Verde Cooperative in Colombia tokenizes a **500-bag washed Caturra lot** as `cvCOFFEE`. Nordlicht Roasters in Germany requests a quote, receives multiple maker quotes, accepts the best one, passes compliance, settles, and reviews the audit trail.

---

## Demo Environment Checklist

### Wallets / Actors
- **Exporter wallet:** Finca Verde Cooperative
- **Buyer wallet:** Nordlicht Roasters
- **2–3 maker bot identities/wallets**
- **Compliance / validator service active**
- **Presenter wallet session already authenticated**

### Network / App
- Monad testnet RPC reachable
- Frontend deployed and pre-opened in browser
- Cleanverse integration reachable:
  - `CVI / A-Pass` identity gate
  - `CVA / A-Token` coffee lot wrapper
  - `CCP` compliance validator
- Explorer tabs pre-opened for:
  - token mint / asset record
  - RFQ / settlement transaction
- Audit report view preloaded or quickly accessible

### Seed Data
- `cvCOFFEE` lot exists or is mintable live:
  - Lot: **500 bags**
  - Origin: **Colombia**
  - Producer: **Finca Verde Cooperative**
  - Process: **Washed**
  - Variety: **Caturra**
- Buyer account pre-whitelisted / identity-approved
- Maker bots funded and online
- Quotes configured to return within a few seconds

### Presenter Setup
- Browser tabs arranged in sequence
- Wallet popups unblocked
- Zoom level readable on projector
- Fallback screenshots or backup environment ready
- Short URLs / bookmarks prepared

---

## 5–7 Minute Demo Flow

### 0:00–0:30 — Frame the problem
**Screen:** Landing page / dashboard

**Say:**  
“Coffee trading still relies on fragmented documentation, manual checks, and slow settlement. BeanForQuote turns a real coffee lot into a compliant onchain asset and settles it through an RFQ flow on Monad testnet.”

---

### 0:30–1:15 — Identity-gated entry
**Screen:** Login / gated dashboard

**Clicks:**
1. Click `Connect Wallet`
2. Click `Verify with Cleanverse` or equivalent gated-entry CTA
3. Show successful `A-Pass / CVI` status
4. Enter buyer dashboard

**Say:**  
“Access is not anonymous. We use Cleanverse identity gating so only approved participants can request or respond to quotes.”

**Point out:**
- wallet connected
- verified identity badge / access status
- role-aware dashboard if available

---

### 1:15–2:00 — Show the tokenized coffee lot
**Screen:** Asset / lot details page

**Clicks:**
1. Open `cvCOFFEE` asset
2. Open lot detail card / metadata panel
3. Briefly show wrapped asset / token ID / provenance fields

**Say:**  
“This lot is a wrapped coffee asset through Cleanverse A-Token rails. Here, Finca Verde’s 500-bag washed Caturra lot is represented as `cvCOFFEE` with structured metadata and audit-friendly provenance.”

**Point out:**
- exporter: Finca Verde Cooperative
- origin: Colombia
- lot size: 500 bags
- wrapped asset / token identifier

---

### 2:00–3:15 — Buyer submits RFQ
**Screen:** RFQ creation form

**Clicks:**
1. Click `Request Quote` / `New RFQ`
2. Select `cvCOFFEE`
3. Enter quantity / trade size
4. Confirm destination or settlement terms
5. Click `Submit RFQ`

**Suggested script values:**
- Asset: `cvCOFFEE`
- Quantity: use exact pilot quantity or a representative subset if required by UI
- Buyer: Nordlicht Roasters
- Destination: Germany

**Say:**  
“Nordlicht Roasters now requests executable quotes for this coffee lot. Instead of negotiating manually, the buyer submits one RFQ and multiple liquidity providers respond.”

**Point out:**
- RFQ ID
- timestamp
- buyer identity
- pending quote state

---

### 3:15–4:15 — Maker bots return quotes
**Screen:** RFQ live quote board

**Clicks:**
1. Open submitted RFQ
2. Wait for quotes to populate
3. Highlight 2–3 quotes
4. Sort by best price if supported

**Say:**  
“Here the maker bots compete to fill the order. The buyer gets transparent, comparable quotes instead of a single opaque price.”

**Point out:**
- 2–3 makers responding
- price differences
- fill amount / expiry
- best quote indicator

---

### 4:15–5:00 — Accept best quote
**Screen:** Quote selection / confirmation modal

**Clicks:**
1. Select best quote
2. Click `Accept`
3. Confirm wallet transaction

**Say:**  
“Nordlicht chooses the best quote. At this point the system moves from price discovery into controlled settlement.”

**Point out:**
- selected maker
- best execution
- quote lock / acceptance timestamp

---

### 5:00–6:00 — Compliance + settlement
**Screen:** Compliance status then settlement success

**Clicks:**
1. Show `Compliance Check` step
2. Expand validator details if visible
3. Show pass status
4. Show settlement completion screen
5. Optionally click out to Monad explorer

**Say:**  
“Before settlement finalizes, CCP validator checks confirm policy and participant requirements. Once compliance passes, settlement completes and the transaction is recorded on Monad testnet.”

**Point out:**
- compliance pass
- validator / policy result
- settlement hash / transaction link
- final status: settled

---

### 6:00–7:00 — Audit-ready output
**Screen:** Audit report / settlement summary

**Clicks:**
1. Open `Audit Report` / `Export`
2. Scroll briefly through summary
3. Highlight key fields

**Say:**  
“This is the operational payoff: identity, asset provenance, quote competition, compliance, and settlement are all captured in one audit-ready output.”

**Point out:**
- who traded
- what asset / lot traded
- winning quote
- compliance result
- tx hash / timestamps
- exportable report

---

## Exact Screens to Have Ready

1. **Landing / dashboard**
2. **Identity-gated access state**
3. **cvCOFFEE asset detail page**
4. **RFQ creation form**
5. **RFQ live quotes view**
6. **Quote acceptance modal**
7. **Compliance pass screen**
8. **Settlement success screen**
9. **Monad explorer tx page**
10. **Audit report / export view**

---

## Backup Failure-Mode Demo

If live quote timing, wallet signing, or RPC is unstable, switch to a controlled backup flow.

### Backup Path A — Pre-seeded RFQ
Use a pre-created RFQ with quotes already returned.

**Say:**  
“To stay within hackathon time, I’ll jump to a pre-seeded RFQ that shows the same end state.”

### Backup Path B — Compliance fail, then pass
Show one compliance-failed example, then the successful one.

**Say:**  
“This is useful because it shows the system doesn’t just settle everything blindly. It blocks ineligible flows before finalization.”

### Backup Path C — Screenshot sequence
Use timestamped screenshots for:
- RFQ submitted
- quotes received
- quote accepted
- compliance passed
- settlement complete
- audit report generated

**Say:**  
“The UI is the same flow; I’m using captured states here in case of testnet latency.”

---

## Failure Handling Lines

### If maker quotes are slow
“Quotes are bot-driven and testnet timing can vary, so I’ll switch to the prepared RFQ view showing the exact same response set.”

### If wallet popup fails
“I already have the signed path prepared, so I’ll move to the confirmed transaction state.”

### If RPC / explorer lags
“The settlement has completed in-app; explorer indexing is just a few seconds behind.”

### If compliance service stalls
“I’ll use the cached successful validation result to show the downstream settlement and report output.”

---

## Talking Points

- **Real-world commodity workflow:** structured RFQ for coffee trading
- **Identity-first access:** only approved actors can participate
- **Tokenized asset model:** coffee lot wrapped as a transferable onchain representation
- **Competitive execution:** multiple makers improve pricing transparency
- **Compliance before settlement:** not an afterthought
- **Auditability:** one trace from identity to final settlement record
- **Monad fit:** fast, testnet-native settlement experience for this style of workflow

---

## What to Explicitly Say Is Mocked or Out of Scope

Be direct and say this clearly:

- This is a **pilot on Monad testnet**
- **Maker liquidity is bot-driven** for demo purposes
- **Coffee custody / warehousing / shipping** are not being settled physically in this demo
- **Price formation is simulated within the demo environment**, even though the RFQ workflow is real
- **Compliance policies are simplified** to demonstrate validator gating and pass/fail logic
- **No production legal, payments, or fiat rails** are implied by this prototype
- Cleanverse integrations shown here are focused on:
  - identity gating
  - wrapped asset representation
  - compliance validation
  - audit output

---

## Suggested 20-Second Closing

“BeanForQuote shows how a tokenized coffee lot can move through identity-gated RFQ pricing, compliance validation, and settlement on Monad testnet, with an audit trail from start to finish. The key value is not just tokenization — it’s making commodity trade execution programmable, compliant, and reviewable.”

---

## Presenter Notes

- Keep the pace brisk; do not type more than necessary live
- Narrate outcomes, not implementation details
- Pause only on:
  - identity gate
  - competing quotes
  - compliance pass
  - settlement proof
  - audit report
- If time is short, skip detailed asset metadata and go straight from lot page to RFQ to quotes to settlement
