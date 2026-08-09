"use client";

import { FlowShell, GatedStorySection } from "@/components/flow-shell";
import { useFlow } from "@/components/flow-provider";
import { LotDetailCard } from "@/components/lot-detail-card";
import { LotStatusRail } from "@/components/lot-status-rail";

function InspectorPageContent() {
  const { selectedLot } = useFlow();

  return (
    <GatedStorySection label="Inspector attestation access" requiredRole="qualityInspector">
      <div className="space-y-6">
        <section className="border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-[var(--shadow-elevated)]">
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Attestation checkpoint
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            Quality inspector sign-off context
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted-strong)]">
            The inspector route focuses on whether the lot is ready to move from draft representation to attested issuance. In the current demo, this is still an informational checkpoint rather than a live signature workflow.
          </p>
        </section>

        <LotDetailCard lot={selectedLot} />
        <LotStatusRail
          attestationStatus={selectedLot.attestationStatus}
          custodyStatus={selectedLot.custodyStatus}
        />
      </div>
    </GatedStorySection>
  );
}

export default function InspectorPage() {
  return (
    <FlowShell
      eyebrow="Step 03"
      title="Inspector attestation"
      intro="Move into the quality-inspector perspective to explain why attestation and custody progression gate issuance and downstream transfer readiness."
    >
      <InspectorPageContent />
    </FlowShell>
  );
}
