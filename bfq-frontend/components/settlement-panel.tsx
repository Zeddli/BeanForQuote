import type { DemoRfq, SettlementRecord, SettlementStatus } from "@/types/domain";
import { truncateHash } from "@/lib/format";

interface SettlementPanelProps {
  rfq: DemoRfq;
  selectedMaker: string | null;
  settlement: SettlementRecord;
  onSettlementChange: (settlement: SettlementRecord) => void;
}

const statusTone: Record<SettlementStatus, string> = {
  "awaiting-compliance": "border-[color:color-mix(in_oklab,var(--warning)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning-strong)]",
  approved: "border-[color:color-mix(in_oklab,var(--success)_42%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success-strong)]",
  settled: "border-[color:color-mix(in_oklab,var(--success)_42%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success-strong)]",
  rejected: "border-[color:color-mix(in_oklab,var(--danger)_38%,transparent)] bg-[color:color-mix(in_oklab,var(--danger)_12%,transparent)] text-[var(--danger-strong)]",
};

export function SettlementPanel({
  rfq,
  selectedMaker,
  settlement,
  onSettlementChange,
}: SettlementPanelProps) {
  const canAttemptSettlement = rfq.status === "accepted" || rfq.status === "settled";

  function setStatus(status: SettlementStatus) {
    onSettlementChange({
      ...settlement,
      selectedMaker: selectedMaker ?? settlement.selectedMaker,
      complianceStatus: status,
    });
  }

  return (
    <section className="border border-[var(--line-strong)] bg-[var(--paper)] p-5 shadow-[var(--shadow-elevated)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Settlement flow
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            Compliance and execution state
          </h3>
        </div>
        <span className={`inline-flex border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusTone[settlement.complianceStatus]}`}>
          {settlement.complianceStatus}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="border border-[var(--line)] bg-[var(--paper-soft)] p-4">
          <p className="text-sm text-[var(--muted)]">Selected maker</p>
          <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">{selectedMaker ?? "No quote selected"}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">
            Settlement should not proceed until a quote is selected and the RFQ has advanced to the accepted state.
          </p>
        </div>
        <div className="border border-[var(--line)] bg-[var(--paper-soft)] p-4">
          <p className="text-sm text-[var(--muted)]">Current RFQ state</p>
          <p className="mt-2 text-lg font-semibold capitalize text-[var(--ink-strong)]">{rfq.status}</p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted-strong)]">
            {canAttemptSettlement
              ? "The request is in a state where compliance review or settlement preview can be demonstrated."
              : "Advance the RFQ to accepted before demonstrating the settlement path."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[var(--muted)]">Trade reference</span>
          <span className="font-medium text-[var(--ink-strong)]">{settlement.tradeId}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[var(--muted)]">Travel Rule ref</span>
          <span className="font-medium text-[var(--ink-strong)]">{settlement.travelRuleRef}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[var(--muted)]">Audit report</span>
          <span className="font-medium text-[var(--ink-strong)]">{settlement.auditReportId}</span>
        </div>
        <div className="grid gap-2 pt-2">
          <span className="text-[var(--muted)]">Transaction reference</span>
          <span className="break-all font-medium text-[var(--ink-strong)]">
            {truncateHash(settlement.transactionHash, 16, 12)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setStatus("awaiting-compliance")}
          disabled={!canAttemptSettlement}
          className="border border-[var(--line-strong)] px-4 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-colors hover:bg-[var(--paper-soft)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Await compliance
        </button>
        <button
          type="button"
          onClick={() => setStatus("approved")}
          disabled={!canAttemptSettlement}
          className="border border-[var(--line-strong)] px-4 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-colors hover:bg-[var(--paper-soft)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Mark approved
        </button>
        <button
          type="button"
          onClick={() => setStatus("settled")}
          disabled={!canAttemptSettlement}
          className="border border-[var(--ink-strong)] bg-[var(--ink-strong)] px-4 py-3 text-sm font-semibold text-[var(--paper)] transition-colors hover:bg-[var(--muted-strong)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Mark settled
        </button>
        <button
          type="button"
          onClick={() => setStatus("rejected")}
          disabled={!canAttemptSettlement}
          className="border border-[var(--line-strong)] px-4 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-colors hover:bg-[var(--paper-soft)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Mark rejected
        </button>
      </div>

      <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
        This panel models settlement states for the demo shell only. It does not claim live Monad confirmation or
        live Cleanverse compliance responses yet.
      </p>
    </section>
  );
}
