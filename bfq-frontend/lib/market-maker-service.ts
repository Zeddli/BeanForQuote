import { DEMO_WALLETS } from "./contracts";
import type { Quote } from "@/types/domain";

export interface MarketMakerConfig {
  makerId: string;
  makerName: string;
  walletAddress: string;
  referencePricePerKg: number; // Base commodity reference price in USD/kg (e.g. Arabica benchmark)
  baseSpreadPercent: number;    // Maker baseline margin percentage (e.g. 0.02 = +2%)
  simulatedInventoryKg: number; // Current physical warehouse inventory
  targetInventoryKg: number;    // Target baseline inventory level
  skewFactor: number;           // Skew sensitivity coefficient
  validityWindowSeconds: number;// Quote expiration duration
  fillRatePercent: number;      // Historical settlement fill rate
  settlementSpeedSeconds: number; // Avg execution latency
}

export const DEMO_MARKET_MAKERS: MarketMakerConfig[] = [
  {
    makerId: "maker-b",
    makerName: "Market Maker Beta",
    walletAddress: DEMO_WALLETS.makerB.address,
    referencePricePerKg: 8.00,
    baseSpreadPercent: 0.015,     // 1.5% tight spread
    simulatedInventoryKg: 15000,  // Excess inventory (> 8,000 kg target)
    targetInventoryKg: 8000,
    skewFactor: 0.08,             // Negative skew lowers price to incentivize sales
    validityWindowSeconds: 52,
    fillRatePercent: 99.6,
    settlementSpeedSeconds: 0.8,
  },
  {
    makerId: "maker-a",
    makerName: "Market Maker Alpha",
    walletAddress: DEMO_WALLETS.makerA.address,
    referencePricePerKg: 8.00,
    baseSpreadPercent: 0.025,     // 2.5% base spread
    simulatedInventoryKg: 8000,   // Balanced target inventory
    targetInventoryKg: 8000,
    skewFactor: 0.10,
    validityWindowSeconds: 45,
    fillRatePercent: 99.2,
    settlementSpeedSeconds: 1.2,
  },
  {
    makerId: "maker-c",
    makerName: "Market Maker Gamma",
    walletAddress: DEMO_WALLETS.makerC.address,
    referencePricePerKg: 8.00,
    baseSpreadPercent: 0.035,     // 3.5% wide spread
    simulatedInventoryKg: 3000,   // Low inventory (< 8,000 kg target)
    targetInventoryKg: 8000,
    skewFactor: 0.12,             // Positive skew raises price to conserve stock
    validityWindowSeconds: 60,
    fillRatePercent: 95.5,
    settlementSpeedSeconds: 2.5,
  },
];

/**
 * Calculates competitive market maker quote based on standard inventory-skew pricing model:
 *
 * P_quote = RefPrice * (1 + BaseSpread + SkewTerm)
 * SkewTerm = ((TargetInventory - CurrentInventory) / TargetInventory) * SkewFactor
 *
 * Economic Logic:
 * • CurrentInventory > TargetInventory (Excess Stock)  => SkewTerm < 0 => Lower price to clear stock!
 * • CurrentInventory < TargetInventory (Low Stock)     => SkewTerm > 0 => Higher price to conserve stock!
 */
export function calculateMakerQuote(
  maker: MarketMakerConfig,
  requestedQuantityKg: number
): Quote {
  const inventoryDiff = maker.targetInventoryKg - maker.simulatedInventoryKg;
  const inventorySkewTerm = (inventoryDiff / maker.targetInventoryKg) * maker.skewFactor;
  
  const totalPriceMultiplier = 1 + maker.baseSpreadPercent + inventorySkewTerm;
  
  const rawPricePerKg = maker.referencePricePerKg * totalPriceMultiplier;
  const roundedPricePerKg = Number(rawPricePerKg.toFixed(2));
  const roundedPricePerLb = Number((roundedPricePerKg / 2.20462).toFixed(2));

  let inventoryView = "Balanced inventory";
  if (maker.simulatedInventoryKg > maker.targetInventoryKg) {
    inventoryView = "High inventory, discount pricing to clear stock";
  } else if (maker.simulatedInventoryKg < maker.targetInventoryKg) {
    inventoryView = "Low inventory, premium pricing to conserve stock";
  }

  return {
    makerId: maker.makerId,
    maker: maker.makerName,
    makerName: maker.makerName,
    pricePerKg: roundedPricePerKg,
    pricePerLb: roundedPricePerLb,
    expiresInSeconds: maker.validityWindowSeconds,
    status: "live",
    inventoryView: `${inventoryView} (${maker.simulatedInventoryKg.toLocaleString()} kg in vault)`,
    fillRatePercent: maker.fillRatePercent,
    settlementSpeedSeconds: maker.settlementSpeedSeconds,
  };
}

/**
 * Generates active quotes from all 3 registered market maker bots for a given RFQ
 */
export function generateAllMakerQuotes(requestedQuantityKg: number): Quote[] {
  return DEMO_MARKET_MAKERS.map((maker) => calculateMakerQuote(maker, requestedQuantityKg));
}
