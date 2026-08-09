import type { DemoRfq, SettlementRecord } from "@/types/domain";

interface SettlementReadinessCardProps {
  rfq: DemoRfq;
  selectedMaker: string | null;
  settlement: SettlementRecord;
}

export function SettlementReadinessCard({
  rfq,
  selectedMaker,
  settlement,
}: SettlementReadinessCardProps) {
  const readinessChecks = [
    {
      label: "Quote selected",
      passed: Boolean(selectedMaker),
      detail: selectedMaker ? selectedMaker : "No maker selected yet",
    },
    {
      label: "RFQ accepted",
      passed: rfq.status === "accepted" || rfq.status === "settled",
      detail: `Current state: ${rfq.status}`,
    },
    {
      label: "Compliance outcome",
      passed: settlement.complianceStatus === "approved" || settlement.complianceStatus === "settled",
      detail: `Current status: ${settlement.complianceStatus}`,
    },
  ];

  return (
    <section className="border border-[var(--line)] bg-[var(--paper-soft)] p-5">
      <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        Settlement readiness
      </p>
      <div className="mt-4 grid gap-3">
        {readinessChecks.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-3 border border-[var(--line)] bg-[var(--paper)] p-4">
            <div>
              <p className="font-semibold text-[var(--ink-strong)]">{item.label}</p>
              <p className="mt-1 text-sm text-[var(--muted-strong)]">{item.detail}</p>
            </div>
            <span
              className={`inline-flex border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                item.passed
                  ? "border-[color:color-mix(in_oklab,var(--success)_42%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success-strong)]"
                  : "border-[color:color-mix(in_oklab,var(--warning)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning-strong)]"
              }`}
            >
              {item.passed ? "Ready" : "Blocked"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
