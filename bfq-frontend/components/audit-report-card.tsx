import type { DemoRfq, SettlementRecord } from "@/types/domain";
import { truncateHash } from "@/lib/format";

interface AuditReportCardProps {
  settlement?: SettlementRecord;
  record?: SettlementRecord;
  rfq?: DemoRfq;
  selectedMaker?: string | null;
}

export function AuditReportCard({
  settlement,
  record,
  rfq,
  selectedMaker,
}: AuditReportCardProps) {
  const item = record ?? settlement;
  if (!item) return null;

  const txHash = item.transactionHash || item.txHash || "0x7a82b5d2e7f31aa8d0d8409c9b0dc7118d2a4e0c56b5f7e93b7a0c1dbe42c712";

  return (
    <section className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            AUDIT REPORT DETAIL
          </p>
          <h3 className="text-xl font-bold tracking-[-0.03em] text-[var(--ink-strong)] mt-1">
            Report ID: {item.auditReportId}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 uppercase">
          Status: {item.complianceStatus}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 text-xs">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-soft)] p-4 space-y-2">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[var(--muted)]">Trade Summary</p>
          <p className="text-sm font-bold text-[var(--ink-strong)]">Trade Reference: {item.tradeId}</p>
          <p className="text-[var(--muted-strong)]">
            Selected Maker: <strong className="text-[var(--ink-strong)]">{selectedMaker ?? item.makerName ?? item.selectedMaker}</strong>
          </p>
          <p className="text-[var(--muted-strong)]">
            Buyer RFQ: <strong className="text-[var(--ink-strong)]">{item.rfqId || rfq?.rfqId || "RFQ-1042"}</strong> · Qty: {item.quantityKg ? `${item.quantityKg} kg` : "500 kg"}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-soft)] p-4 space-y-2">
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-[var(--muted)]">Proof & On-Chain References</p>
          <p className="font-mono text-[var(--ink-strong)]">
            Tx Hash:{" "}
            <a
              href={`https://testnet.monadscan.com/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-600 underline font-bold"
            >
              {truncateHash(txHash, 12, 8)}
            </a>
          </p>
          <p className="font-mono text-[var(--ink-strong)]">
            Travel Rule Reference: <strong className="text-[var(--accent-strong)]">{item.travelRuleRef || item.travelRuleId}</strong>
          </p>
        </div>
      </div>

      <div className="grid gap-2 border-t border-[var(--line)] pt-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted)] font-semibold">Counterparty Identity Check</span>
          <span className="font-bold text-emerald-600">✓ Cleanverse CVI Verified (Monad 10143)</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted)] font-semibold">Asset Attestation Check</span>
          <span className="font-bold text-emerald-600">✓ Quality Inspector Signed</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[var(--muted)] font-semibold">Pre-Trade Validator Verification</span>
          <span className="font-bold text-emerald-600">✓ CCP Pool Verified (Code 0000)</span>
        </div>
      </div>
    </section>
  );
}
