import type { Participant } from "@/types/domain";
import { formatRoleLabel } from "@/lib/format";

interface IdentityStateBannerProps {
  participant: Participant;
}

const bannerTone = {
  verified:
    "border-[color:color-mix(in_oklab,var(--success)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_16%,var(--paper))]",
  pending:
    "border-[color:color-mix(in_oklab,var(--warning)_42%,transparent)] bg-[color:color-mix(in_oklab,var(--warning)_16%,var(--paper))]",
  restricted:
    "border-[color:color-mix(in_oklab,var(--danger)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--danger)_16%,var(--paper))]",
} as const;

const bannerCopy = {
  verified: "Verified for role-gated actions in the demo shell.",
  pending: "Visible in the system, but not yet permitted to perform gated actions.",
  restricted: "Blocked from role-gated actions until verification or policy status is restored.",
} as const;

export function IdentityStateBanner({ participant }: IdentityStateBannerProps) {
  return (
    <section className={`border p-4 ${bannerTone[participant.verificationStatus]}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Current access state
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--ink-strong)]">
            {participant.name} · {formatRoleLabel(participant.role)}
          </p>
        </div>
        <span className="inline-flex border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-strong)]">
          {participant.cleanverseScope}
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{bannerCopy[participant.verificationStatus]}</p>
    </section>
  );
}
