# BeanForQuote (CoffeeRFQ)

**Compliant Price Discovery & RFQ Settlement Layer for Tokenized Physical Commodity RWAs on Monad**

*Cleanverse Build: Trusted Assets Hackathon — RWA Track*

---

## ☕ Overview

**BeanForQuote (CoffeeRFQ)** is an RFQ-based settlement layer for tokenized coffee lots deployed on **Monad Testnet**. Verified exporters and roasters trade CVA-wrapped commodity tokens (`cvCOFFEE`) against signed, time-boxed quotes from verified market makers — replacing illiquid AMM bonding curves with compliant, OTC-style physical commodity pricing.

---

## 🛡 Cleanverse Settlement & Permission Architecture

Cleanverse identity verification is integrated natively across the settlement engine and token contracts:

| Role | SubGroup | Touches Payment Leg? | A-Pass Mechanically Required? | Architectural Rationale |
|---|---|---|---|---|
| **Buyer** | `BY` | **Yes** (Sends `cvUSDC`) | **Yes (Forced)** | Cleanverse A-Token contract natively checks sender A-Pass prior to transfer |
| **Market Maker** | `MM` | **Yes** (Receives `cvUSDC`) | **Yes (Forced)** | Cleanverse A-Token contract natively checks receiver A-Pass prior to transfer |
| **Exporter** | `EX` | **No** (Receives `cvCOFFEE`) | Model Consistency | Gated for lot minting & supply-chain provenance accountability |
| **Quality Inspector** | `QI` | **No** (Attestation signature) | Model Consistency | Gated via `AttestationRegistry` for certified cupping signatures |
| **Custodian** | `CU` | **No** (Status update) | Model Consistency | Gated via `CustodyRegistry` for physical warehouse custody tracking |
| **Regulator / Auditor** | `RG`/`AU` | **No** (Read/Rule enforce) | Model Consistency | Governance-granted permission for lot freeze & Travel Rule inspection |

> **Mechanical Enforcement:** The payment leg of every trade moves through a Cleanverse-wrapped A-Token (`cvUSDC`). That token's smart contract enforces transfer eligibility natively — any wallet sending (Buyer) or receiving (Market Maker) payment needs an active, non-frozen Cleanverse A-Pass on-chain.
>
> *For detailed architecture specifications, see [`docs/08_Cleanverse_Settlement_Architecture.md`](file:///home/zhijian/beanforquote/docs/08_Cleanverse_Settlement_Architecture.md).*

---

## 🚀 Deployed Smart Contracts (Monad Testnet — Chain ID `10143`)

All contracts are deployed, initialized, and linked live on the Monad Testnet:

| Contract | Address | Description |
|---|---|---|
| **`CleanverseCVIAdapter`** | [`0x1c5fa313efc3868e0396532f92c163c02c148d6d`](https://testnet.monadscan.com/address/0x1c5fa313efc3868e0396532f92c163c02c148d6d) | CVI adapter verifying Cleanverse A-Pass NFT on-chain ownership (`0xbA82...`) & role gating |
| **`MockCleanverseCVA`** | [`0xcfb4dd97d787c8818247ff4a77fe31208abfdc3a`](https://testnet.monadscan.com/address/0xcfb4dd97d787c8818247ff4a77fe31208abfdc3a) | CVA wrapper managing compliant asset tokenization & transfer eligibility checks |
| **`AttestationRegistry`** | [`0xf76a2decdd3dca42c6f95d5c3148c6e2accd42c4`](https://testnet.monadscan.com/address/0xf76a2decdd3dca42c6f95d5c3148c6e2accd42c4) | On-chain registry storing Quality Inspector cupping & grade attestations |
| **`CustodyRegistry`** | [`0x7bd85132c3befaefca9b4b870073453714dfa362`](https://testnet.monadscan.com/address/0x7bd85132c3befaefca9b4b870073453714dfa362) | On-chain registry tracking physical custody transitions per coffee lot |
| **`RuleEngine`** | [`0x157209a3bc4100723e0d302f6163f1ec410bae66`](https://testnet.monadscan.com/address/0x157209a3bc4100723e0d302f6163f1ec410bae66) | Regulator jurisdiction rules, wallet flags, and lot freeze enforcement |
| **`CoffeeLotToken`** | [`0xab06536d0f182db3c54f6e1d7503d5ddd489dc84`](https://testnet.monadscan.com/address/0xab06536d0f182db3c54f6e1d7503d5ddd489dc84) | CVA-wrapped coffee lot token with metadata & dual-checkpoint compliance checks |
| **`AuditLog`** | [`0xd169c004f7a20fdba82dafd15c3e2c080f3b92a8`](https://testnet.monadscan.com/address/0xd169c004f7a20fdba82dafd15c3e2c080f3b92a8) | Immutable trade settlement history with Travel Rule data recording |
| **`SettlementEngine`** | [`0xed26a56ab4daf8f5a36a039e179ed4938fc976e8`](https://testnet.monadscan.com/address/0xed26a56ab4daf8f5a36a039e179ed4938fc976e8) | Atomic trade settlement engine (coffee lot token ↔ stablecoin) |
| **`RFQEngine`** | [`0x4a56d24fbb25769f1c2e9aaef0d2d756a2a5fa6e`](https://testnet.monadscan.com/address/0x4a56d24fbb25769f1c2e9aaef0d2d756a2a5fa6e) | RFQ lifecycle engine: request → signed quote → accept → compliance check → settle |
| **`ValidatorPool`** | [`0x2155cf30AB82DBdB074bB1B9222E4e33B422532C`](https://testnet.monadscan.com/address/0x2155cf30AB82DBdB074bB1B9222E4e33B422532C) | Cleanverse Compliance Protocol (CCP) registered validator compliance pool |

---

## 🆔 Cleanverse A-Pass Pre-Registered Demo Wallets (Monad Testnet)

All demo participant wallets are pre-registered on-chain via Cleanverse `POST /generate_apass` (`chain: "monad"`) with verified A-Pass identities:

| Role | Entity / Label | Wallet Address | Monad A-Pass Issuance Tx Hash |
|---|---|---|---|
| **Exporter** | Finca Verde Cooperative | `0xD06178216134c059BF17c4D3dD60CCD36074edfd` | [`0x3ba1fcdd...`](https://testnet.monadscan.com/tx/0x3ba1fcdd4878f97938446f7e3029a00d6183ba130c1c86c178bd96fccf53fbaa) |
| **Buyer** | Nordlicht Roasters | `0x9703f29Ab27a1D72502cfeDFc739d26aA41abF88` | [`0x101f6273...`](https://testnet.monadscan.com/tx/0x101f62738865ce0f0f6ca38eeb4cbddd70d5615a5fadf65cdb5dd5722722e54c) |
| **Market Maker A** | Market Maker Alpha | `0xcA3DC1C67a7da6e8ac1A4c89b19350fE5059EAEe` | [`0x0b3533e7...`](https://testnet.monadscan.com/tx/0x0b3533e769bb03b0f7a3cc37698bac20c96c0719cdb8b17bcbd496756aef4598) |
| **Market Maker B** | Market Maker Beta | `0xe363CdAD20d73D91Fa43DB35FdaA432B863F56d9` | [`0xe2c0b23b...`](https://testnet.monadscan.com/tx/0xe2c0b23ba88e8e1cd8e85b86db58f7533cacae2624418847cbb66d37493ec1b6) |
| **Market Maker C** | Market Maker Gamma | `0x658A0dDaECBc2a662168c21AB02e983b722f5a37` | [`0x63773479...`](https://testnet.monadscan.com/tx/0x63773479b663441abc2f9ab177594d26cd423fcc9d8f2a877809beb8051648b7) |
| **Quality Inspector**| Specialty Coffee Inspector| `0xe2690d943008be679A6eC7aBFe84dFCB1935095c` | [`0xa3320a34...`](https://testnet.monadscan.com/tx/0xa3320a343a4a1cfdacca99db732f3f88bff307bda5cbdf3fed9f9ab5b56d1363) |
| **Regulator** | Commodity Compliance Admin| `0x67C8d12801E00d86d71D0B17b9aa15B7d2498d4a` | [`0xda345a01...`](https://testnet.monadscan.com/tx/0xda345a01db57e37e35be2d37f4de3dfd7359e112087e13d0e688a2d480fc24b8) |
| **Auditor** | Audit & Compliance Viewer | `0xFca4A2EA6B048ea7e92B0d55a898706d8F047D7A` | [`0x8aa54293...`](https://testnet.monadscan.com/tx/0x8aa54293de0d16f00f64f2831b1d01a2d4c5839200d8bfe48d9def8e5eacbd7f) |

---

## 🌐 Network Configuration (Monad Testnet)

- **Network Name:** Monad Testnet
- **Chain ID:** `10143`
- **RPC URL:** `https://testnet-rpc.monad.xyz`
- **Block Explorer:** `https://testnet.monadscan.com`
- **Cleanverse A-Pass NFT Contract:** `0xbA82D189540CaC9DC6FF46B6837CaC1BFdEC58B9`

---

## 🛠️ Verification & Development

### 1. Smart Contract Unit Tests (Foundry)
```bash
cd contracts
forge test
```

### 2. Verify On-Chain Roles (Cast CLI)
```bash
# Check if Exporter wallet has EXPORTER_ROLE on Monad Testnet
cast call 0x1c5fa313efc3868e0396532f92c163c02c148d6d "hasRole(address,bytes32)(bool)" 0xD06178216134c059BF17c4D3dD60CCD36074edfd $(cast keccak "EXPORTER_ROLE") --rpc-url https://testnet-rpc.monad.xyz
# Returns: true
```

### 3. Frontend Web Application (Next.js)
```bash
cd bfq-frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the multi-role settlement interface.
