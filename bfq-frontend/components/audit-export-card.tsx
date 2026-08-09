import type { SettlementRecord } from "@/types/domain";

interface AuditExportCardProps {
  settlement?: SettlementRecord;
  record?: SettlementRecord;
}

export function AuditExportCard({ settlement, record }: AuditExportCardProps) {
  const item = record ?? settlement;
  if (!item) return null;

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--paper-soft)] p-6 space-y-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
        COMPLIANCE AUDIT EXPORT PACKAGE
      </p>

      <div className="grid gap-4 sm:grid-cols-2 text-xs leading-relaxed text-[var(--muted-strong)]">
        <div className="rounded border border-[var(--line)] bg-[var(--paper)] p-4 space-y-2">
          <p className="font-bold text-[var(--ink-strong)]">Report Package ID: {item.auditReportId}</p>
          <p>
            Packages trade reference #{item.tradeId}, counterparty identity context ({item.selectedMaker}), Cleanverse CCP validator proof, and on-chain settlement receipt into an auditor-facing export.
          </p>
        </div>

        <div className="rounded border border-[var(--line)] bg-[var(--paper)] p-4 space-y-2">
          <p className="font-bold text-[var(--ink-strong)]">Travel Rule Artifact</p>
          <p>
            Travel Rule metadata <span className="font-mono font-bold text-[var(--accent-strong)]">{item.travelRuleRef || item.travelRuleId}</span> is stored immutably on Monad Testnet <code className="text-[0.68rem]">AuditLog</code> contract.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={() => alert(`Exporting Audit Package ${item.auditReportId}...`)}
          className="rounded-lg bg-[var(--accent-strong)] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[var(--accent)] transition-all flex items-center gap-1.5"
        >
          📥 Export Audit Package (.json / .pdf)
        </button>
      </div>
    </section>
  );
}
