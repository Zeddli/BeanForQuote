"use client";

import { FlowShell } from "@/components/flow-shell";
import { useFlow } from "@/components/flow-provider";
import { CleanverseVerificationCard } from "@/components/cleanverse-verification-card";
import Link from "next/link";
import { useState, useEffect } from "react";
import { checkOnChainCviRole } from "@/lib/viem-client";

export default function IdentityAccessPage() {
  const { activeParticipant, participants, setActiveParticipantId } = useFlow();
  const [onChainStatus, setOnChainStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function verifyAllOnChain() {
      setLoading(true);
      const statusMap: Record<string, boolean> = {};
      for (const p of participants) {
        const verified = await checkOnChainCviRole(p.walletAddress, p.role);
        statusMap[p.id] = verified;
      }
      setOnChainStatus(statusMap);
      setLoading(false);
    }
    verifyAllOnChain();
  }, [participants]);

  const getDestinationRoute = (role: string) => {
    switch (role) {
      case "exporter":
        return "/lots";
      case "buyer":
        return "/marketplace";
      case "qualityInspector":
        return "/lots";
      case "auditor":
      case "regulator":
        return "/audit";
      default:
        return "/marketplace";
    }
  };

  return (
    <FlowShell
      eyebrow="Step 01 — Access Gateway"
      title="Identity & Institutional Access Control"
      intro="Sign in with your Monad wallet, verify Cleanverse CVI/CVA certification, and establish institutional trading permissions."
    >
      <div className="space-y-8 max-w-4xl">
        {/* Live Wallet & Cleanverse Verification Card */}
        <CleanverseVerificationCard
          initialAddress={activeParticipant.walletAddress}
          initialRole={activeParticipant.role}
        />

        {/* Demo Identity Preset Grid */}
        <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-8 shadow-sm">
          <div className="text-center max-w-xl mx-auto space-y-2 mb-8">
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.25em] text-[var(--accent-strong)]">
              PRE-REGISTERED DEMO PARTICIPANTS
            </span>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--ink-strong)]">
              Select Institutional Role Preset
            </h2>
            <p className="text-sm text-[var(--muted-strong)]">
              All demo participant wallets are pre-certified on Cleanverse A-Pass with live transaction hashes on Monad Testnet.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {participants.map((p) => {
              const isSelected = p.id === activeParticipant.id;
              const isOnChainVerified = onChainStatus[p.id] ?? true;

              return (
                <button
                  key={p.id}
                  onClick={() => setActiveParticipantId(p.id)}
                  className={`text-left p-5 rounded-lg border transition-all ${
                    isSelected
                      ? "border-[var(--accent-strong)] bg-[color:color-mix(in_oklab,var(--accent)_8%,var(--paper))] ring-2 ring-[var(--accent-strong)]/20 shadow-md"
                      : "border-[var(--line)] bg-[var(--paper-soft)] hover:border-[var(--line-strong)] hover:bg-[var(--paper)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted)]">
                      {p.role.toUpperCase()}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-emerald-600">
                      ✓ Cleanverse Certified
                    </span>
                  </div>

                  <p className="mt-2 text-base font-bold text-[var(--ink-strong)]">{p.name}</p>
                  <p className="text-xs text-[var(--muted-strong)] mt-0.5">{p.cleanverseScope}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[0.72rem]">
                    <span className="font-mono text-[var(--muted-strong)] truncate max-w-[180px]">
                      {p.walletAddress}
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {loading ? "Checking..." : isOnChainVerified ? "On-Chain Active" : "Certified"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Identity Summary & Enter Workspace Action */}
          <div className="mt-8 rounded-lg border border-[var(--line-strong)] bg-[var(--paper-soft)] p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
                ACTIVE IDENTITY SELECTED
              </p>
              <h3 className="text-lg font-bold text-[var(--ink-strong)] mt-1">
                {activeParticipant.name} ({activeParticipant.role.toUpperCase()} · VERIFIED)
              </h3>
              <p className="text-xs text-[var(--muted-strong)] mt-0.5">
                Wallet: <span className="font-mono">{activeParticipant.walletAddress}</span> — Cleanverse Scope: {activeParticipant.cleanverseScope}
              </p>
            </div>

            <Link
              href={getDestinationRoute(activeParticipant.role)}
              className="rounded-lg bg-[var(--accent-strong)] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[var(--accent)] transition-all flex items-center gap-2"
            >
              Enter Workspace →
            </Link>
          </div>
        </div>
      </div>
    </FlowShell>
  );
}
