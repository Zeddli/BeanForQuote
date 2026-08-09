import type { Participant, ParticipantRole } from "@/types/domain";
import { formatRoleLabel } from "@/lib/format";

interface IdentityPanelProps {
  activeParticipant: Participant;
  availableParticipants: Participant[];
  availableRoles: ParticipantRole[];
  onSelectParticipant: (participantId: string) => void;
}

const verificationTone = {
  verified:
    "border-[color:color-mix(in_oklab,var(--success)_42%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success-strong)]",
  pending:
    "border-[color:color-mix(in_oklab,var(--warning)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning-strong)]",
  restricted:
    "border-[color:color-mix(in_oklab,var(--danger)_36%,transparent)] bg-[color:color-mix(in_oklab,var(--danger)_14%,transparent)] text-[var(--danger-strong)]",
} as const;

export function IdentityPanel({
  activeParticipant,
  availableParticipants,
  availableRoles,
  onSelectParticipant,
}: IdentityPanelProps) {
  return (
    <section className="border border-[var(--line-strong)] bg-[var(--paper)] p-5 shadow-[var(--shadow-elevated)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Access state
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            Cleanverse identity gate
          </h2>
        </div>
        <span className={`inline-flex border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${verificationTone[activeParticipant.verificationStatus]}`}>
          {activeParticipant.verificationStatus}
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--muted)]">Active demo identity</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ink-strong)]">{activeParticipant.name}</p>
            <p className="text-sm text-[var(--muted-strong)]">
              {formatRoleLabel(activeParticipant.role)} · {activeParticipant.region}
            </p>
          </div>

          <dl className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
              <dt className="text-[var(--muted)]">Wallet</dt>
              <dd className="font-medium text-[var(--ink-strong)]">{activeParticipant.walletLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
              <dt className="text-[var(--muted)]">Role scope</dt>
              <dd className="font-medium text-[var(--ink-strong)]">{activeParticipant.cleanverseScope}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[var(--muted)]">Gated actions</dt>
              <dd className="font-medium text-[var(--ink-strong)]">
                {availableRoles.includes(activeParticipant.role) ? "Permitted in this shell" : "Unavailable"}
              </dd>
            </div>
          </dl>

          <div className="border border-[var(--line)] bg-[var(--paper-soft)] p-4 text-sm leading-7 text-[var(--muted-strong)]">
            This Phase 3 implementation is a <strong>UI access model</strong>. It does not claim a live A-Pass
            verification response yet. It demonstrates how verified, pending, and restricted states will
            control the demo flow once real Cleanverse status checks are wired in.
          </div>
        </div>

        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Switch demo participant
          </p>
          <div className="mt-4 grid gap-3">
            {availableParticipants.map((participant) => {
              const isActive = participant.id === activeParticipant.id;
              return (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => onSelectParticipant(participant.id)}
                  className={`grid gap-2 border p-4 text-left transition-colors ${
                    isActive
                      ? "border-[var(--accent-strong)] bg-[color:color-mix(in_oklab,var(--accent)_12%,var(--paper))]"
                      : "border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--paper-soft)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[var(--ink-strong)]">{participant.name}</p>
                    <span className={`inline-flex border px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${verificationTone[participant.verificationStatus]}`}>
                      {participant.verificationStatus}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {formatRoleLabel(participant.role)} · {participant.cleanverseScope}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
