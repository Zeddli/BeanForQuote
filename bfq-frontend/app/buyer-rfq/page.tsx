"use client";

import { FlowShell, GatedStorySection } from "@/components/flow-shell";
import { useFlow } from "@/components/flow-provider";
import { LotBrowser } from "@/components/lot-browser";
import { QuoteBoard } from "@/components/quote-board";
import { QuoteControls } from "@/components/quote-controls";
import { QuoteSummaryCard } from "@/components/quote-summary-card";
import { RfqLifecycleCard } from "@/components/rfq-lifecycle-card";
import { RfqRequestPanel } from "@/components/rfq-request-panel";
import { RfqStateActions } from "@/components/rfq-state-actions";

function BuyerRfqPageContent() {
  const {
    lots,
    selectedLot,
    setSelectedLotId,
    rfqState,
    setRfqState,
    selectedMaker,
    setSelectedMaker,
  } = useFlow();

  return (
    <GatedStorySection label="Buyer RFQ access" requiredRole="buyer">
      <div className="space-y-5">
        <LotBrowser
          lots={lots}
          selectedLotId={selectedLot.lotId}
          onSelectLot={setSelectedLotId}
        />

        <div className="border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Selected lot context
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
                {selectedLot.lotId}
              </h2>
            </div>
            <span className="text-sm text-[var(--muted-strong)]">{selectedLot.gradeLabel}</span>
          </div>

          <div className="mt-4 grid gap-3 text-sm leading-7 text-[var(--muted-strong)] sm:grid-cols-2">
            <div className="border border-[var(--line)] bg-[var(--paper-soft)] p-4">
              <p className="font-semibold text-[var(--ink-strong)]">Quality summary</p>
              <p className="mt-2">{selectedLot.qualitySummary}</p>
            </div>
            <div className="border border-[var(--line)] bg-[var(--paper-soft)] p-4">
              <p className="font-semibold text-[var(--ink-strong)]">Transfer rule summary</p>
              <p className="mt-2">{selectedLot.transferRuleSummary}</p>
            </div>
          </div>
        </div>

        <RfqRequestPanel lot={selectedLot} initialRfq={rfqState} onRfqChange={setRfqState} />
        <RfqLifecycleCard rfq={rfqState} />
        <QuoteSummaryCard rfq={rfqState} selectedMaker={selectedMaker} />
        <QuoteBoard rfq={rfqState} selectedMaker={selectedMaker} onSelectMaker={setSelectedMaker} />
        <QuoteControls
          rfq={rfqState}
          selectedMaker={selectedMaker}
          onRfqChange={setRfqState}
          onSelectedMakerChange={setSelectedMaker}
        />
        <RfqStateActions rfq={rfqState} onRfqChange={setRfqState} />
      </div>
    </GatedStorySection>
  );
}

export default function BuyerRfqPage() {
  return (
    <FlowShell
      eyebrow="Step 04"
      title="Buyer RFQ workflow"
      intro="The buyer route turns lot discovery into an RFQ flow with shared selected lot context, quote comparison, and explicit request-state progression."
    >
      <BuyerRfqPageContent />
    </FlowShell>
  );
}
