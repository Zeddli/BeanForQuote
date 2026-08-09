import type { DemoRfq, RfqStatus } from "@/types/domain";

interface RfqLifecycleCardProps {
  rfq: DemoRfq;
}

const lifecycleStates: RfqStatus[] = ["open", "quoted", "accepted", "settled", "expired"];

export function RfqLifecycleCard({ rfq }: RfqLifecycleCardProps) {
  const activeIndex = lifecycleStates.indexOf(rfq.status);
  const expired = rfq.status === "expired";

  return (
    <section className="border border-[var(--line)] bg-[var(--paper)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            RFQ lifecycle
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            Request state progression
          </h3>
        </div>
        <span className="text-sm text-[var(--muted)]">{rfq.buyerName} · {rfq.quantityBags} bags</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        {lifecycleStates.map((state, index) => {
          const isCurrent = state === rfq.status;
          const reached = !expired && activeIndex >= index;
          const isExpiredOnly = expired && state === "expired";

          return (
            <div
              key={state}
              className={`border p-3 text-sm ${
                isCurrent
                  ? isExpiredOnly
                    ? "border-[color:color-mix(in_oklab,var(--danger)_36%,transparent)] bg-[color:color-mix(in_oklab,var(--danger)_12%,var(--paper))]"
                    : "border-[var(--accent-strong)] bg-[color:color-mix(in_oklab,var(--accent)_12%,var(--paper))]"
                  : reached
                    ? "border-[color:color-mix(in_oklab,var(--success)_30%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_10%,var(--paper))]"
                    : "border-[var(--line)] bg-[var(--paper-soft)]"
              }`}
            >
              <p className="font-semibold capitalize text-[var(--ink-strong)]">{state}</p>
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
