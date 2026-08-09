import type { AttestationStatus, CustodyStatus } from "@/types/domain";

interface LotStatusRailProps {
  attestationStatus: AttestationStatus;
  custodyStatus: CustodyStatus;
}

const custodyOrder: CustodyStatus[] = ["in-warehouse", "released", "in-transit", "delivered"];

export function LotStatusRail({ attestationStatus, custodyStatus }: LotStatusRailProps) {
  const activeCustodyIndex = custodyOrder.indexOf(custodyStatus);

  return (
    <section className="border border-[var(--line)] bg-[var(--paper)] p-5">
      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Lot-state readiness
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
            This surface tracks the two states judges need to understand immediately: whether the lot is attested
            for issuance and where it sits in custody progression.
          </p>
        </div>

        <div className="grid gap-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--ink-strong)]">Attestation gate</p>
              <span className={`inline-flex border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                attestationStatus === "signed"
                  ? "border-[color:color-mix(in_oklab,var(--success)_42%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success-strong)]"
                  : "border-[color:color-mix(in_oklab,var(--warning)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning-strong)]"
              }`}>
                {attestationStatus}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--muted-strong)]">
              {attestationStatus === "signed"
                ? "Mint path may proceed once the exporter has the required verified role."
                : "Mint path remains blocked until the quality inspector signs the attestation."}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--ink-strong)]">Custody progression</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {custodyOrder.map((step, index) => {
                const reached = index <= activeCustodyIndex;
                const current = step === custodyStatus;
                return (
                  <div
                    key={step}
                    className={`border p-3 text-sm ${
                      current
                        ? "border-[var(--accent-strong)] bg-[color:color-mix(in_oklab,var(--accent)_12%,var(--paper))]"
                        : reached
                          ? "border-[color:color-mix(in_oklab,var(--success)_30%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_10%,var(--paper))]"
                          : "border-[var(--line)] bg-[var(--paper-soft)]"
                    }`}
                  >
                    <p className="font-semibold capitalize text-[var(--ink-strong)]">{step.replace(/-/g, " ")}</p>
                    <p className="mt-1 text-[var(--muted)]">
                      {current ? "Current state" : reached ? "Completed" : "Awaiting update"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
