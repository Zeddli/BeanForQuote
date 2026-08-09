import { useMemo, useState } from "react";
import type { CoffeeLot, DemoRfq, RfqStatus } from "@/types/domain";

interface RfqRequestPanelProps {
  lot: CoffeeLot;
  initialRfq: DemoRfq;
  onRfqChange: (rfq: DemoRfq) => void;
}

const statusTone: Record<RfqStatus, string> = {
  open: "border-[color:color-mix(in_oklab,var(--accent)_38%,transparent)] bg-[color:color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent-strong)]",
  quoted: "border-[color:color-mix(in_oklab,var(--accent)_38%,transparent)] bg-[color:color-mix(in_oklab,var(--accent)_12%,transparent)] text-[var(--accent-strong)]",
  accepted: "border-[color:color-mix(in_oklab,var(--success)_42%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success-strong)]",
  settled: "border-[color:color-mix(in_oklab,var(--success)_42%,transparent)] bg-[color:color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success-strong)]",
  expired: "border-[color:color-mix(in_oklab,var(--danger)_36%,transparent)] bg-[color:color-mix(in_oklab,var(--danger)_12%,transparent)] text-[var(--danger-strong)]",
};

export function RfqRequestPanel({ lot, initialRfq, onRfqChange }: RfqRequestPanelProps) {
  const [quantity, setQuantity] = useState(String(initialRfq.quantityBags));
  const [destination, setDestination] = useState(initialRfq.destination);
  const [expirySeconds, setExpirySeconds] = useState("120");
  const [message, setMessage] = useState<string | null>(null);

  const parsedQuantity = Number(quantity);
  const parsedExpiry = Number(expirySeconds);

  const validationMessage = useMemo(() => {
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return "Enter a positive RFQ quantity.";
    }
    if (parsedQuantity > lot.quantityBags) {
      return `Requested quantity exceeds available lot size of ${lot.quantityBags} bags.`;
    }
    if (!destination.trim()) {
      return "Destination is required.";
    }
    if (!Number.isFinite(parsedExpiry) || parsedExpiry < 30) {
      return "RFQ expiry must be at least 30 seconds for the demo flow.";
    }
    return null;
  }, [destination, lot.quantityBags, parsedExpiry, parsedQuantity]);

  function handleSubmit() {
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    const nextStatus: RfqStatus = initialRfq.quotes.length > 0 ? "quoted" : "open";
    onRfqChange({
      ...initialRfq,
      lotId: lot.lotId,
      quantityBags: parsedQuantity,
      destination: destination.trim(),
      status: nextStatus,
    });
    setMessage(`RFQ prepared for ${parsedQuantity} bags of ${lot.lotId} to ${destination.trim()}.`);
  }

  function handleExpire() {
    onRfqChange({
      ...initialRfq,
      lotId: lot.lotId,
      quantityBags: parsedQuantity > 0 ? parsedQuantity : initialRfq.quantityBags,
      destination: destination.trim() || initialRfq.destination,
      status: "expired",
    });
    setMessage("RFQ marked expired to demonstrate the no-fill / stale-request path.");
  }

  return (
    <section className="border border-[var(--line)] bg-[var(--paper)] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            RFQ request builder
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink-strong)]">
            {initialRfq.rfqId}
          </h3>
        </div>
        <span className={`inline-flex border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusTone[initialRfq.status]}`}>
          {initialRfq.status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-[var(--ink-strong)]">Quantity (bags)</span>
          <input
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            inputMode="numeric"
            className="border border-[var(--line)] bg-[var(--paper-soft)] px-3 py-3 text-[var(--ink-strong)] outline-none transition-colors focus:border-[var(--accent-strong)]"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-[var(--ink-strong)]">Destination</span>
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            className="border border-[var(--line)] bg-[var(--paper-soft)] px-3 py-3 text-[var(--ink-strong)] outline-none transition-colors focus:border-[var(--accent-strong)]"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-[var(--ink-strong)]">RFQ expiry (seconds)</span>
          <input
            value={expirySeconds}
            onChange={(event) => setExpirySeconds(event.target.value)}
            inputMode="numeric"
            className="border border-[var(--line)] bg-[var(--paper-soft)] px-3 py-3 text-[var(--ink-strong)] outline-none transition-colors focus:border-[var(--accent-strong)]"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted-strong)] sm:grid-cols-3">
        <p>
          <span className="text-[var(--muted)]">Selected lot:</span> {lot.lotId}
        </p>
        <p>
          <span className="text-[var(--muted)]">Available size:</span> {lot.quantityBags} bags
        </p>
        <p>
          <span className="text-[var(--muted)]">Attestation:</span> {lot.attestationStatus}
        </p>
      </div>

      {(message || validationMessage) && (
        <div className="mt-5 border border-[var(--line)] bg-[var(--paper-soft)] p-4 text-sm leading-7 text-[var(--muted-strong)]">
          {message ?? validationMessage}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          className="border border-[var(--ink-strong)] bg-[var(--ink-strong)] px-4 py-3 text-sm font-semibold text-[var(--paper)] transition-colors hover:bg-[var(--muted-strong)]"
        >
          Prepare RFQ
        </button>
        <button
          type="button"
          onClick={handleExpire}
          className="border border-[var(--line-strong)] px-4 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-colors hover:bg-[var(--paper-soft)]"
        >
          Mark expired
        </button>
      </div>
    </section>
  );
}
