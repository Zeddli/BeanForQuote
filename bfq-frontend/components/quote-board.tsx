import type { DemoRfq, QuoteStatus } from "@/types/domain";
import { formatCountdown } from "@/lib/format";

interface QuoteBoardProps {
  rfq: DemoRfq;
  selectedMaker: string | null;
  onSelectMaker: (maker: string) => void;
  maxPrice?: number;
  minPrice?: number;
}

const quoteTone: Record<QuoteStatus, string> = {
  live: "border-[var(--line)] bg-[var(--paper-soft)] hover:bg-[var(--paper)] hover:border-[var(--line-strong)]",
  accepted: "border-[var(--accent-strong)] bg-[color:color-mix(in_oklab,var(--accent)_12%,var(--paper))] ring-2 ring-[var(--accent-strong)]/20",
  expired: "border-[color:color-mix(in_oklab,var(--danger)_26%,transparent)] bg-[color:color-mix(in_oklab,var(--danger)_10%,var(--paper))] opacity-55",
};

export function QuoteBoard({ rfq, selectedMaker, onSelectMaker, maxPrice = 8.50, minPrice = 7.50 }: QuoteBoardProps) {
  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            LIVE MARKET MAKER FEED & INVENTORY-SKEW MATRIX
          </p>
          <h3 className="text-xl font-bold tracking-[-0.03em] text-[var(--ink-strong)]">
            Competitive Multi-Factor Quote Comparison
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[0.68rem] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700">
            🏷 Reserve Floor: ${minPrice.toFixed(2)}/kg
          </span>
          <span className="text-[0.68rem] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
            ⚡ Instant Settle Ceiling: ${maxPrice.toFixed(2)}/kg
          </span>
        </div>
      </div>

      <div className="grid gap-3 pt-2">
        <div className="hidden sm:grid sm:grid-cols-[1.2fr_1.1fr_1fr_0.7fr_auto] gap-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)] px-2">
          <span>Market Maker Entity</span>
          <span>Fill Reliability & Latency</span>
          <span>Quoted Unit Price</span>
          <span>Expiry</span>
          <span className="text-right">Action / State</span>
        </div>

        {rfq.quotes.map((quote) => {
          const makerId = quote.makerId || quote.maker;
          const isSelected = quote.maker === selectedMaker || quote.makerId === selectedMaker;
          const isExpired = quote.status === "expired" || rfq.status === "expired";
          const priceKg = quote.pricePerKg ?? (quote.pricePerLb * 2.20462);

          // Instant Settle badge specifically applies if quote matches instant-settle ceiling or is marked instantEligible
          const isInstantEligible = Boolean(quote.instantEligible || (maxPrice > 0 && Math.abs(priceKg - maxPrice) < 0.02));

          const fillRate = quote.fillRatePercent ?? 95.0;
          const latency = quote.settlementSpeedSeconds ?? 2.0;

          return (
            <button
              key={quote.maker}
              type="button"
              disabled={isExpired}
              onClick={() => onSelectMaker(makerId)}
              className={`grid gap-3 rounded-lg border p-4 text-left transition-all sm:grid-cols-[1.2fr_1.1fr_1fr_0.7fr_auto] sm:items-center ${quoteTone[isExpired ? "expired" : isSelected ? "accepted" : quote.status]} disabled:cursor-not-allowed`}
            >
              {/* Entity & Inventory */}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-[var(--ink-strong)] text-sm">{quote.makerName || quote.maker}</p>
                  {isInstantEligible && (
                    <span className="text-[0.62rem] font-bold text-amber-700 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                      ⚡ Instant Target
                    </span>
                  )}
                </div>
                <p className="text-[0.72rem] text-[var(--muted-strong)] mt-0.5 max-w-[220px] truncate" title={quote.inventoryView}>
                  {quote.inventoryView}
                </p>
              </div>

              {/* Reliability & Speed Metrics */}
              <div>
                <div className="flex flex-col gap-0.5 text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    ⚡ {fillRate}% Fill Rate
                  </span>
                  <span className="text-[0.7rem] text-[var(--muted-strong)] font-mono">
                    {latency}s execution latency
                  </span>
                </div>
              </div>

              {/* Price */}
              <div>
                <p className="text-base font-bold text-[var(--ink-strong)]">
                  ${priceKg.toFixed(2)}/kg
                </p>
                <p className="text-xs font-mono text-[var(--muted-strong)]">
                  (${quote.pricePerLb.toFixed(2)}/lb)
                </p>
              </div>

              {/* Expiry Countdown */}
              <div>
                <span className="text-xs font-bold text-amber-600 font-mono">
                  ⏱ {formatCountdown(quote.expiresInSeconds)}
                </span>
              </div>

              {/* Action Button */}
              <div className="text-right">
                <span className={`inline-flex rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-[var(--accent-strong)] text-white shadow"
                    : isExpired
                    ? "bg-red-500/10 text-red-600"
                    : "bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink-strong)] hover:border-[var(--accent-strong)]"
                }`}>
                  {isExpired ? "Expired" : isSelected ? "Selected ✓" : "Select Quote"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
