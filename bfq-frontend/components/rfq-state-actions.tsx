import type { DemoRfq } from "@/types/domain";

interface RfqStateActionsProps {
  rfq: DemoRfq;
  onRfqChange: (rfq: DemoRfq) => void;
}

export function RfqStateActions({ rfq, onRfqChange }: RfqStateActionsProps) {
  function advanceToAccepted() {
    if (rfq.status !== "quoted") return;
    onRfqChange({ ...rfq, status: "accepted" });
  }

  function advanceToSettled() {
    if (rfq.status !== "accepted") return;
    onRfqChange({ ...rfq, status: "settled" });
  }

  function resetToOpen() {
    onRfqChange({ ...rfq, status: "open" });
  }

  return (
    <section className="border border-[var(--line)] bg-[var(--paper-soft)] p-5">
      <p className="text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
        RFQ state controls
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={advanceToAccepted}
          disabled={rfq.status !== "quoted"}
          className="border border-[var(--line-strong)] px-4 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-colors hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Mark accepted
        </button>
        <button
          type="button"
          onClick={advanceToSettled}
          disabled={rfq.status !== "accepted"}
          className="border border-[var(--line-strong)] px-4 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-colors hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Mark settled
        </button>
        <button
          type="button"
          onClick={resetToOpen}
          className="border border-[var(--line-strong)] px-4 py-3 text-sm font-semibold text-[var(--ink-strong)] transition-colors hover:bg-[var(--paper)]"
        >
          Reset to open
        </button>
      </div>
      <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
        These controls simulate explicit lifecycle progression for the frontend shell. They are not yet wired to
        contracts or a backend service.
      </p>
    </section>
  );
}
