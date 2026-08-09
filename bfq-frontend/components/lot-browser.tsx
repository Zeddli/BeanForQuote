import type { CoffeeLot } from "@/types/domain";

interface LotBrowserProps {
  lots: CoffeeLot[];
  selectedLotId: string;
  onSelectLot: (lotId: string) => void;
}

export function LotBrowser({ lots, selectedLotId, onSelectLot }: LotBrowserProps) {
  return (
    <section className="border border-[var(--line)] bg-[var(--paper)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Buyer lot browser
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            Verified lot selection
          </h3>
        </div>
        <span className="text-sm text-[var(--muted)]">Lot-level metadata stays visible before RFQ submission.</span>
      </div>

      <div className="mt-5 grid gap-3">
        {lots.map((lot) => {
          const isSelected = lot.lotId === selectedLotId;
          return (
            <button
              key={lot.lotId}
              type="button"
              onClick={() => onSelectLot(lot.lotId)}
              className={`grid gap-2 border p-4 text-left transition-colors ${
                isSelected
                  ? "border-[var(--accent-strong)] bg-[color:color-mix(in_oklab,var(--accent)_12%,var(--paper))]"
                  : "border-[var(--line)] bg-[var(--paper-soft)] hover:bg-[var(--paper)]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-[var(--ink-strong)]">{lot.lotId}</p>
                <span className="text-sm text-[var(--muted-strong)]">{lot.quantityBags} bags</span>
              </div>
              <p className="text-sm text-[var(--muted)]">
                {lot.origin} · {lot.region} · {lot.variety} · {lot.process}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
