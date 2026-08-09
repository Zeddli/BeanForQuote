import type { CoffeeLot } from "@/types/domain";

interface LotDetailCardProps {
  lot: CoffeeLot;
}

const statusTone = {
  signed:
    "border-[color:color-mix(in_oklab,var(--success)_42%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success-strong)]",
  pending:
    "border-[color:color-mix(in_oklab,var(--warning)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--warning)_14%,transparent)] text-[var(--warning-strong)]",
  "in-warehouse":
    "border-[color:color-mix(in_oklab,var(--ink)_16%,transparent)] bg-[color:color-mix(in_oklab,var(--ink)_6%,transparent)] text-[var(--muted-strong)]",
  released:
    "border-[color:color-mix(in_oklab,var(--accent)_32%,transparent)] bg-[color:color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent-strong)]",
  "in-transit":
    "border-[color:color-mix(in_oklab,var(--warning)_36%,transparent)] bg-[color:color-mix(in_oklab,var(--warning)_12%,transparent)] text-[var(--warning-strong)]",
  delivered:
    "border-[color:color-mix(in_oklab,var(--success)_42%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success-strong)]",
} as const;

export function LotDetailCard({ lot }: LotDetailCardProps) {
  return (
    <article className="grid gap-5 border border-[var(--line)] bg-[var(--paper-soft)] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Tokenized coffee lot
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3.5rem)] leading-none tracking-[-0.04em] text-[var(--ink-strong)]">
            {lot.assetSymbol}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-[var(--muted-strong)]">
          <span className={`border px-3 py-1 ${statusTone[lot.attestationStatus]}`}>
            Attestation {lot.attestationStatus}
          </span>
          <span className={`border px-3 py-1 ${statusTone[lot.custodyStatus]}`}>
            Custody {lot.custodyStatus}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <p className="text-sm leading-7 text-[var(--muted-strong)]">
            {lot.exporterName} is preparing a lot from {lot.region}, {lot.origin}. The lot is represented as a
            compliance-constrained coffee asset with lot-specific metadata rather than a fungible pool token.
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Lot ID</dt>
              <dd className="mt-1 font-medium text-[var(--ink-strong)]">{lot.lotId}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Quantity</dt>
              <dd className="mt-1 font-medium text-[var(--ink-strong)]">{lot.quantityBags} bags</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Variety</dt>
              <dd className="mt-1 font-medium text-[var(--ink-strong)]">{lot.variety}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Process</dt>
              <dd className="mt-1 font-medium text-[var(--ink-strong)]">{lot.process}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Harvest date</dt>
              <dd className="mt-1 font-medium text-[var(--ink-strong)]">{lot.harvestDate}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Asset model</dt>
              <dd className="mt-1 font-medium text-[var(--ink-strong)]">{lot.tokenStandard}</dd>
            </div>
          </dl>
        </div>

        <div className="border-l border-[var(--line)] pl-0 lg:pl-6">
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Transfer constraint summary
          </p>
          <div className="mt-4 grid gap-4 text-sm leading-7 text-[var(--muted-strong)]">
            <div className="border border-[var(--line)] bg-[var(--paper)] p-4">
              <p className="font-semibold text-[var(--ink-strong)]">Verified-wallet routing</p>
              <p className="mt-2">Lot transfer is intended to move only across verified participant wallets in the Cleanverse model.</p>
            </div>
            <div className="border border-[var(--line)] bg-[var(--paper)] p-4">
              <p className="font-semibold text-[var(--ink-strong)]">Lot-specific settlement context</p>
              <p className="mt-2">Origin, grade, quantity, and custody state remain attached to this lot view instead of collapsing into fungible pool inventory.</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
