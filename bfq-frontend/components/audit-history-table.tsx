import type { SettlementRecord } from "@/types/domain";

interface AuditHistoryTableProps {
  history?: SettlementRecord[];
  records?: SettlementRecord[];
  selectedTradeId: string;
  onSelectTrade: (tradeId: string) => void;
}

export function AuditHistoryTable({
  history,
  records,
  selectedTradeId,
  onSelectTrade,
}: AuditHistoryTableProps) {
  const items = records ?? history ?? [];

  return (
    <section className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            HISTORICAL TRADES
          </p>
          <h3 className="text-lg font-bold text-[var(--ink-strong)]">
            Settlement Record Index
          </h3>
        </div>
        <span className="text-xs font-semibold text-[var(--muted)]">{items.length} Records</span>
      </div>

      <div className="mt-4 grid gap-3">
        {items.map((record) => {
          const active = record.tradeId === selectedTradeId;
          return (
            <button
              key={record.tradeId}
              type="button"
              onClick={() => onSelectTrade(record.tradeId)}
              className={`rounded-lg border p-4 text-left transition-all ${
                active
                  ? "border-[var(--accent-strong)] bg-[color:color-mix(in_oklab,var(--accent)_10%,var(--paper))]"
                  : "border-[var(--line)] bg-[var(--paper-soft)] hover:bg-[var(--paper)] hover:border-[var(--line-strong)]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-mono text-sm font-bold text-[var(--ink-strong)]">{record.tradeId}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.68rem] font-bold text-emerald-600 uppercase">
                  ✓ {record.complianceStatus || "Settled"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted-strong)]">
                <span>Lot: {record.lotId || "LOT-ETH-042"}</span>
                <span>Qty: {record.quantityKg ? `${record.quantityKg} kg` : "500 kg"}</span>
                <span>Maker: {record.selectedMaker || record.makerName}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
