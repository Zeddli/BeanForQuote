"use client";

import { FlowShell, GatedStorySection } from "@/components/flow-shell";
import { useFlow } from "@/components/flow-provider";
import Link from "next/link";
import { useState } from "react";

export default function MarketplacePage() {
  const { lots, setSelectedLotId } = useFlow();
  const [originFilter, setOriginFilter] = useState<string>("All");

  const filteredLots = originFilter === "All"
    ? lots
    : lots.filter((l) => l.origin.toLowerCase().includes(originFilter.toLowerCase()));

  return (
    <FlowShell
      eyebrow="Step 04 — Discovery"
      title="Marketplace & Available Coffee"
      intro="Find verified tokenized coffee lots available for institutional RFQ."
    >
      <GatedStorySection label="Buyer Marketplace Access" requiredRole="buyer">
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
            <div>
              <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--ink-strong)]">
                Available Coffee Lots ({filteredLots.length})
              </h2>
              <p className="text-xs text-[var(--muted-strong)]">
                All lots are verified on-chain via Cleanverse A-Pass credentials and Quality Inspector attestations.
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[var(--muted)] uppercase tracking-wider">Filter Origin:</span>
              {["All", "Ethiopia", "Colombia", "Brazil"].map((o) => (
                <button
                  key={o}
                  onClick={() => setOriginFilter(o)}
                  className={`rounded-md px-3 py-1.5 font-bold transition-all ${
                    originFilter === o
                      ? "bg-[var(--accent-strong)] text-white"
                      : "bg-[var(--paper-soft)] border border-[var(--line)] text-[var(--ink-strong)] hover:bg-[var(--paper)]"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Lot Marketplace Cards List */}
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredLots.map((lot) => (
              <div
                key={lot.lotId}
                className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[var(--accent-strong)] bg-[var(--paper-soft)] px-2.5 py-1 rounded border border-[var(--line)]">
                      {lot.lotId}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-emerald-600">
                      ✓ Verified CVA Asset
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--ink-strong)] mt-3">
                    {lot.origin} {lot.region}
                  </h3>
                  <p className="text-xs text-[var(--muted-strong)] mt-1">{lot.qualitySummary}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-[var(--line)] pt-3">
                    <div>
                      <span className="text-[var(--muted)] text-[0.68rem] uppercase font-bold block">Available Qty</span>
                      <span className="font-bold text-[var(--ink-strong)]">{lot.quantityKg.toLocaleString()} kg</span>
                    </div>
                    <div>
                      <span className="text-[var(--muted)] text-[0.68rem] uppercase font-bold block">Process / Harvest</span>
                      <span className="font-bold text-[var(--ink-strong)]">{lot.process} · 2026</span>
                    </div>
                  </div>

                  {/* Exporter Pricing Bounds Badge Bar */}
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-[var(--line)] text-xs">
                    <span className="text-[0.68rem] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                      🏷 Reserve: <strong>${lot.minPrice ? lot.minPrice.toFixed(2) : "7.50"}/kg</strong>
                    </span>
                    <span className="text-[0.68rem] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      ⚡ Instant Settle: <strong>${lot.maxPrice ? lot.maxPrice.toFixed(2) : "8.50"}/kg</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
                  <span className="text-xs font-semibold text-blue-600">
                    ● Custody: {lot.custodyStatus}
                  </span>

                  <Link
                    href={`/rfq?lotId=${lot.lotId}`}
                    onClick={() => setSelectedLotId(lot.lotId)}
                    className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[var(--accent)] transition-all flex items-center gap-1.5"
                  >
                    Request Quote →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GatedStorySection>
    </FlowShell>
  );
}
