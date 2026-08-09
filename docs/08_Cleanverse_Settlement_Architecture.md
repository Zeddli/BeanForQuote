# Cleanverse Settlement & Permission Architecture

## Overview

In **BeanForQuote (CoffeeRFQ)**, Cleanverse identity verification is integrated deeply into both smart contract logic and token-level transfer enforcement. This document outlines why specific roles are gated by Cleanverse A-Passes, distinguishing between **Mechanically Forced** enforcement and **Model Consistency** gating.

---

## 1. Mechanical Enforcement vs. Model Consistency

| Role | SubGroup | Touches Payment Leg? | A-Pass Mechanically Required? | Architectural Rationale |
|---|---|---|---|---|
| **Buyer** | `BY` | **Yes** (Sends `cvUSDC`) | **Yes (Forced)** | Cleanverse A-Token contract natively checks sender A-Pass prior to transfer |
| **Market Maker** | `MM` | **Yes** (Receives `cvUSDC`) | **Yes (Forced)** | Cleanverse A-Token contract natively checks receiver A-Pass prior to transfer |
| **Exporter** | `EX` | **No** (Receives `cvCOFFEE`) | Model Consistency | Gated for lot minting & supply-chain provenance accountability |
| **Quality Inspector** | `QI` | **No** (Attestation signature) | Model Consistency | Gated via `AttestationRegistry` for certified cupping signatures |
| **Custodian** | `CU` | **No** (Status update) | Model Consistency | Gated via `CustodyRegistry` for physical warehouse custody tracking |
| **Regulator / Auditor** | `RG`/`AU` | **No** (Read/Rule enforce) | Model Consistency | Governance-granted permission for lot freeze & Travel Rule inspection |

---

## 2. Deep Dive: Mechanical Settlement Enforcement

### The Payment Leg Requirement
In every RFQ trade settlement:
$$\text{Buyer} \xrightarrow{\text{wrapped } cvUSDC} \text{Market Maker}$$
$$\text{Market Maker} \xrightarrow{\text{wrapped } cvCOFFEE} \text{Buyer}$$

Because `cvUSDC` is a Cleanverse-wrapped A-Token, its transfer hook natively validates that **both counterparty wallets** hold an active, non-frozen Cleanverse A-Pass (`CVI`). 
Even if the application layer attempted to bypass role checks, the underlying token transfer would fail on-chain. Market Makers are direct counterparties in the payment leg, so holding a valid A-Pass is mechanically forced by Cleanverse's token architecture.

---

## 3. Product Realism: Dedicated Market Maker Role (`subGroup: "MM"`)

Real-world OTC commodity RFQ networks (e.g., Hashflow, Bebop, 0x RFQ) rely on a curated set of professional liquidity providers (e.g., Wintermute, Amber, GSR) rather than anonymous permissionless takers:
- **Capital Commitment & Inventory Risk:** Market Makers take physical inventory risk and commit liquidity, requiring a distinct risk profile and verification level.
- **Higher Tier Assurance:** Market Makers can be gated on `minTier = 50` (Institutional Verification Tier), ensuring liquidity providers undergo deeper institutional scrutiny than individual buyers or exporters.

---

## 4. Q&A Defense Strategy for Judges

If asked by hackathon judges why non-payment roles (e.g., Quality Inspector or Custodian) require a Cleanverse A-Pass:
> *"Buyer and Market Maker verification is mechanically forced by Cleanverse token-level transfer hooks on the payment leg. Quality Inspector and Custodian verification is applied for model consistency across the permission layer — unifying supply chain provenance, cupping attestations, and settlement under a single Cleanverse compliance envelope at zero additional overhead."*
