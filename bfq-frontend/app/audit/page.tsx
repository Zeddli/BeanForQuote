"use client";

import { useMemo } from "react";
import { FlowShell, GatedStorySection } from "@/components/flow-shell";
import { useFlow } from "@/components/flow-provider";
import { AuditExportCard } from "@/components/audit-export-card";
import { AuditHistoryTable } from "@/components/audit-history-table";
import { AuditReportCard } from "@/components/audit-report-card";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

export default function AuditHistoryPage() {
  const {
    activeParticipant,
    auditHistory,
    selectedTradeId,
    setSelectedTradeId,
    selectedAuditRecord,
    roleRegistrations,
    approveRole,
  } = useFlow();

  const pendingRegistrations = useMemo(() => {
    const map = new Map<string, typeof roleRegistrations[string]>();
    Object.values(roleRegistrations).forEach((reg) => {
      if (reg && reg.status === "Pending Approve") {
        map.set(reg.walletAddress.toLowerCase(), reg);
      }
    });
    return Array.from(map.values());
  }, [roleRegistrations]);

  const isAuditor = activeParticipant.role === "auditor";

  return (
    <FlowShell
      eyebrow="Step 07 — Compliance Oversight"
      title="Audit History & Travel Rule Reports"
      intro="Inspect historical settled trades, Travel Rule metadata packages, and Monad Testnet audit-ready records."
      hideDemoIdentityDrawer={true}
    >
      <GatedStorySection
        label="Audit Log & Oversight Access"
        allowedRoles={["exporter", "buyer", "auditor", "regulator", "marketMaker", "qualityInspector", "custodian"]}
      >
        <div className="space-y-6 max-w-4xl">
          {/* Role Authorization Queue (Pending Auditor Review) */}
          <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
              <div>
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  CLEANVERSE CVI GOVERNANCE QUEUE
                </span>
                <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--ink-strong)] mt-1">
                  Institutional Role Authorization Requests ({pendingRegistrations.length})
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                {isAuditor ? "Auditor Review Active" : "Oversight View"}
              </span>
            </div>

            {pendingRegistrations.length > 0 ? (
              <div className="space-y-3">
                {pendingRegistrations.map((reg) => (
                  <div
                    key={reg.walletAddress}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--ink-strong)]">
                          Wallet: <code className="font-mono bg-[var(--paper)] px-2 py-0.5 rounded border border-[var(--line)]">{reg.walletAddress}</code>
                        </span>
                        <span className="font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded">
                          Role: {reg.role}
                        </span>
                      </div>
                      <p className="text-[0.72rem] text-[var(--muted-strong)]">
                        Submitted: {new Date(reg.requestedAt).toLocaleString()} — Requires Auditor review & on-chain authorization.
                      </p>
                    </div>

                    {isAuditor ? (
                      <button
                        onClick={() => approveRole(reg.walletAddress)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                      >
                        <span>✓</span> Auditor Approve Role
                      </button>
                    ) : (
                      <span className="rounded bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-200">
                        ⏳ Pending Auditor Approval
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs font-semibold">
                <span>✓ All CVI Institutional Role Authorization Requests Approved & Up-to-Date.</span>
                <span className="font-mono text-[0.68rem] bg-emerald-500/20 px-2 py-0.5 rounded">Monad CVI Synced</span>
              </div>
            )}
          </div>

          {/* Audit Log Contract Info */}
          <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-[var(--accent-strong)] bg-[var(--paper-soft)] px-2.5 py-1 rounded border border-[var(--line)]">
                  On-Chain Contract: AuditLog
                </span>
                <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--ink-strong)] mt-2">
                  Historical Settlements & Compliance Records
                </h2>
              </div>
              <div className="text-right text-xs">
                <span className="text-[var(--muted)] font-bold uppercase block">Audit Contract Address</span>
                <code className="font-mono text-[var(--ink-strong)] text-[0.72rem]">{CONTRACT_ADDRESSES.auditLog}</code>
              </div>
            </div>

            <p className="mt-4 text-xs text-[var(--muted-strong)] leading-relaxed">
              Every trade settled through the RFQ Settlement Engine writes an immutable audit record containing buyer and maker identities, trade pricing, lot attestation IDs, and Travel Rule data.
            </p>
          </div>

          {/* Table Component */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              HISTORICAL TRADE RECORDS
            </h3>
            <AuditHistoryTable
              records={auditHistory}
              selectedTradeId={selectedTradeId}
              onSelectTrade={setSelectedTradeId}
            />
          </div>

          {/* Audit Report Details Card */}
          <AuditReportCard record={selectedAuditRecord} />

          {/* Export Card */}
          <AuditExportCard record={selectedAuditRecord} />
        </div>
      </GatedStorySection>
    </FlowShell>
  );
}
