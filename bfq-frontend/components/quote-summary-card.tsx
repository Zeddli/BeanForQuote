import type { DemoRfq } from "@/types/domain";

interface QuoteSummaryCardProps {
  rfq: DemoRfq;
  selectedMaker: string | null;
}

export function QuoteSummaryCard({ rfq, selectedMaker }: QuoteSummaryCardProps) {
  const liveQuotes = rfq.quotes.filter((quote) => quote.status === "live");
  
  const bestLiveQuote = [...liveQuotes].sort((a, b) => {
    const pA = a.pricePerKg ?? a.pricePerLb * 2.20462;
    const pB = b.pricePerKg ?? b.pricePerLb * 2.20462;
    return pA - pB;
  })[0] ?? null;

  const selectedQuote = rfq.quotes.find(
    (quote) => quote.maker === selectedMaker || quote.makerId === selectedMaker
  ) ?? null;

  const bestPriceKg = bestLiveQuote ? (bestLiveQuote.pricePerKg ?? bestLiveQuote.pricePerLb * 2.20462) : 0;

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
        LIVE QUOTE MARKET METRICS
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-soft)] p-4">
          <p className="text-xs font-bold text-[var(--muted-strong)]">Active Quoting Makers</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{liveQuotes.length} Makers</p>
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-soft)] p-4">
          <p className="text-xs font-bold text-[var(--muted-strong)]">Best Competitive Quote</p>
          <p className="mt-1 text-2xl font-bold text-[var(--ink-strong)]">
            {bestLiveQuote ? `$${bestPriceKg.toFixed(2)}/kg` : "—"}
          </p>
          {bestLiveQuote && (
            <span className="text-[0.68rem] text-[var(--muted-strong)] font-mono">
              (${bestLiveQuote.pricePerLb.toFixed(2)}/lb by {bestLiveQuote.makerName || bestLiveQuote.maker})
            </span>
          )}
        </div>
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-soft)] p-4">
          <p className="text-xs font-bold text-[var(--muted-strong)]">Selected Market Maker</p>
          <p className="mt-1 text-lg font-bold text-[var(--accent-strong)]">
            {selectedQuote ? (selectedQuote.makerName || selectedQuote.maker) : "None selected"}
          </p>
        </div>
      </div>
    </section>
  );
}
