import type { ParticipantRole, VerificationStatus } from "@/types/domain";
import { formatRoleLabel } from "@/lib/format";

interface AccessGateProps {
  label: string;
  requiredRole?: ParticipantRole;
  allowedRoles?: ParticipantRole[];
  activeRole: ParticipantRole;
  verificationStatus: VerificationStatus;
  children: React.ReactNode;
}

export function AccessGate({
  label,
  requiredRole,
  allowedRoles,
  activeRole,
  verificationStatus,
  children,
}: AccessGateProps) {
  const roles = allowedRoles ?? (requiredRole ? [requiredRole] : []);
  const roleMatched = roles.length === 0 || roles.includes(activeRole);
  const isVerified = verificationStatus === "verified";
  const granted = roleMatched && isVerified;

  if (granted) {
    return <>{children}</>;
  }

  const roleText = roles.map(formatRoleLabel).join(" / ");
  const reason = !isVerified
    ? verificationStatus === "pending"
      ? `Requires an active ${roleText} verification before this action can be used.`
      : `Access is blocked because this wallet is currently restricted for role-gated actions.`
    : `This screen requires the ${roleText} role. The active demo identity is ${formatRoleLabel(activeRole)}.`;

  return (
    <section className="border border-dashed border-[var(--line-strong)] bg-[var(--paper-soft)] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Access required
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">{label}</h3>
        </div>
        <span className="inline-flex border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)]">
          Requires {roleText}
        </span>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">{reason}</p>
    </section>
  );
}
