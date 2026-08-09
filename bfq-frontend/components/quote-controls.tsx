import type { DemoRfq, QuoteStatus } from "@/types/domain";

interface QuoteControlsProps {
  rfq: DemoRfq;
  selectedMaker: string | null;
  onRfqChange: (rfq: DemoRfq) => void;
  onSelectedMakerChange: (maker: string | null) => void;
}

export function QuoteControls({
  rfq,
  selectedMaker,
  onRfqChange,
  onSelectedMakerChange,
}: QuoteControlsProps) {
  function updateQuoteStatuses(getStatus: (maker: string) => QuoteStatus) {
    onRfqChange({
      ...rfq,
      quotes: rfq.quotes.map((quote) => ({
        ...quote,
        status: getStatus(quote.maker),
      })),
    });
  }

  function markSelected() {
    if (!selectedMaker || rfq.status === "expired") return;
    updateQuoteStatuses((maker) => (maker === selectedMaker ? "accepted" : "live"));
  }

  function expireLowestQuote() {
    const sorted = [...rfq.quotes].sort((a, b) => a.pricePerLb - b.pricePerLb);
    const lowest = sorted[0];
    updateQuoteStatuses((maker) =>
      maker === lowest.maker ? "expired" : rfq.quotes.find((quote) => quote.maker === maker)?.status ?? "live",
    );
    if (selectedMaker === lowest.maker) {
      onSelectedMakerChange(null);
    }
  }

  function simulateFrozenWallet() {
    onRfqChange({
      ...rfq,
      status: "expired",
    });
    alert("⚠️ Simulated Cleanverse CVI Frozen Wallet event: RuleEngine.checkCompliant() reverted with LotFrozen() / NonCompliant()!");
  }

  function restoreQuotes() {
    onRfqChange({
      ...rfq,
      status: "quoted",
    });
    updateQuoteStatuses(() => "live");
    onSelectedMakerChange(null);
  }

  return (
    <section className="border border-[var(--line)] bg-[var(--paper-soft)] p-5 space-y-3">
      <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
        Live Simulation & Compliance Trigger Controls (Judge Testing Panel)
      </p>
      <div className="flex flex-wrap gap-2.5 text-xs">
        <button
          type="button"
          onClick={markSelected}
          disabled={!selectedMaker || rfq.status === "expired"}
          className="rounded border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 py-2 font-bold text-[var(--ink-strong)] hover:bg-emerald-500/10 disabled:opacity-45"
        >
          ✓ Accept Selected Quote
        </button>
        <button
          type="button"
          onClick={expireLowestQuote}
          disabled={rfq.status === "expired"}
          className="rounded border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 py-2 font-bold text-[var(--ink-strong)] hover:bg-amber-500/10 disabled:opacity-45"
        >
          ⏱ Expire Quote
        </button>
        <button
          type="button"
          onClick={simulateFrozenWallet}
          className="rounded border border-red-500/30 bg-red-500/10 px-3.5 py-2 font-bold text-red-700 dark:text-red-300 hover:bg-red-500/20"
        >
          🔴 Simulate Frozen Wallet Rejection
        </button>
        <button
          type="button"
          onClick={restoreQuotes}
          className="rounded border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 py-2 font-bold text-[var(--ink-strong)] hover:bg-[var(--paper-soft)]"
        >
          🔄 Restore Live State
        </button>
      </div>
    </section>
  );
}
