import type { SettlementStatus } from "@/types/domain";

interface SettlementTimelineProps {
  status: SettlementStatus;
}

const timelineStates: SettlementStatus[] = [
  "awaiting-compliance",
  "approved",
  "settled",
  "rejected",
];

export function SettlementTimeline({ status }: SettlementTimelineProps) {
  const activeIndex = timelineStates.indexOf(status);
  const rejected = status === "rejected";

  return (
    <section className="border border-[var(--line)] bg-[var(--paper)] p-5">
      <div>
        <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Settlement timeline
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
          Pre-trade compliance to execution
        </h3>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {timelineStates.map((step, index) => {
          const isCurrent = step === status;
          const reached = !rejected && activeIndex >= index;
          const rejectedOnly = rejected && step === "rejected";
          return (
            <div
              key={step}
              className={`border p-3 text-sm ${
                isCurrent
                  ? rejectedOnly
                    ? "border-[color:color-mix(in_oklab,var(--danger)_38%,transparent)] bg-[color:color-mix(in_oklab,var(--danger)_12%,var(--paper))]"
                    : "border-[var(--accent-strong)] bg-[color:color-mix(in_oklab,var(--accent)_12%,var(--paper))]"
                  : reached
                    ? "border-[color:color-mix(in_oklab,var(--success)_30%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_10%,var(--paper))]"
                    : "border-[var(--line)] bg-[var(--paper-soft)]"
              }`}
            >
              <p className="font-semibold capitalize text-[var(--ink-strong)]">{step.replace(/-/g, " ")}</p>
              <p className="mt-1 text-[var(--muted)]">
                {isCurrent ? "Current" : reached ? "Completed" : "Pending"}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
