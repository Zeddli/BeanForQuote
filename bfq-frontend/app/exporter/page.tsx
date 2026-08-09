"use client";

import { FlowShell, GatedStorySection } from "@/components/flow-shell";
import { useFlow } from "@/components/flow-provider";
import { LotDetailCard } from "@/components/lot-detail-card";
import { LotStatusRail } from "@/components/lot-status-rail";

function ExporterPageContent() {
  const { selectedLot } = useFlow();

  return (
    <GatedStorySection label="Exporter lot issuance access" requiredRole="exporter">
      <div className="space-y-6">
        <LotDetailCard lot={selectedLot} />
        <LotStatusRail
          attestationStatus={selectedLot.attestationStatus}
          custodyStatus={selectedLot.custodyStatus}
        />
      </div>
    </GatedStorySection>
  );
}

export default function ExporterPage() {
  return (
    <FlowShell
      eyebrow="Step 02"
      title="Exporter lot issuance"
      intro="This route isolates the exporter story: a verified exporter views the tokenized coffee lot, its metadata, and the readiness signals needed before issuance and transfer."
    >
      <ExporterPageContent />
    </FlowShell>
  );
}
