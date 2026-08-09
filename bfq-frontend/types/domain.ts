export type ParticipantRole =
  | "exporter"
  | "qualityInspector"
  | "custodian"
  | "buyer"
  | "marketMaker"
  | "regulator"
  | "auditor";

export type VerificationStatus = "verified" | "pending" | "restricted";

export type AttestationStatus = "pending" | "signed";
export type CustodyStatus = "in-warehouse" | "released" | "in-transit" | "delivered";
export type RfqStatus = "open" | "quoted" | "accepted" | "settled" | "expired";
export type QuoteStatus = "live" | "accepted" | "expired";
export type SettlementStatus = "awaiting-compliance" | "approved" | "settled" | "rejected";

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole;
  region: string;
  walletLabel: string;
  walletAddress: string;
  verificationStatus: VerificationStatus;
  cleanverseScope: string;
}

export interface CoffeeLot {
  lotId: string;
  assetSymbol: string;
  exporterName: string;
  origin: string;
  region: string;
  variety: string;
  process: string;
  harvestDate: string;
  quantityBags: number;
  quantityKg: number;
  attestationStatus: AttestationStatus;
  custodyStatus: CustodyStatus;
  tokenStandard: string;
  gradeLabel: string;
  qualitySummary: string;
  transferRuleSummary: string;
  minPrice?: number; // Exporter Reserve Floor ($/kg)
  maxPrice?: number; // Exporter Instant-Settle Ceiling ($/kg)
}

export interface Quote {
  makerId?: string;
  maker: string;
  makerName?: string;
  pricePerLb: number;
  pricePerKg?: number;
  expiresInSeconds: number;
  status: QuoteStatus;
  inventoryView: string;
  fillRatePercent?: number;
  settlementSpeedSeconds?: number;
  instantEligible?: boolean;
}

export interface DemoRfq {
  rfqId: string;
  buyerName: string;
  lotId: string;
  quantityBags: number;
  destination: string;
  status: RfqStatus;
  quotes: Quote[];
}

export interface SettlementRecord {
  tradeId: string;
  rfqId?: string;
  lotId?: string;
  quantityKg?: number;
  pricePerKg?: number;
  totalAmountUsd?: number;
  selectedMaker: string;
  makerName?: string;
  status?: RfqStatus | SettlementStatus;
  complianceStatus: SettlementStatus;
  transactionHash: string;
  txHash?: string | null;
  travelRuleRef: string;
  travelRuleId?: string;
  auditReportId: string;
}
