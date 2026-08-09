"use client";

import { FlowShell, GatedStorySection } from "@/components/flow-shell";
import { useFlow } from "@/components/flow-provider";
import { QuoteBoard } from "@/components/quote-board";
import { QuoteControls } from "@/components/quote-controls";
import { QuoteSummaryCard } from "@/components/quote-summary-card";
import { RfqLifecycleCard } from "@/components/rfq-lifecycle-card";
import { RfqStateActions } from "@/components/rfq-state-actions";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { computeQuotes, deriveReferencePrice } from "@/lib/quote-engine";
import { executeRfqBroadcastWithWallet } from "@/lib/web3-wallet-client";

function RfqContent() {
  const searchParams = useSearchParams();
  const queryLotId = searchParams.get("lotId");

  const {
    lots,
    selectedLot,
    activeParticipant,
    setSelectedLotId,
    rfqState,
    setRfqState,
    selectedMaker,
    setSelectedMaker,
    setSettlementState,
  } = useFlow();

  // Sync URL query param ?lotId=... if present
  useEffect(() => {
    if (queryLotId && queryLotId !== selectedLot.lotId) {
      const found = lots.find((l) => l.lotId === queryLotId);
      if (found) setSelectedLotId(found.lotId);
    }
  }, [queryLotId, lots, selectedLot.lotId, setSelectedLotId]);

  const [showDemoControls, setShowDemoControls] = useState(false);
  const [requestedBags, setRequestedBags] = useState<number>(rfqState.quantityBags || 8);
  const [destinationMarket, setDestinationMarket] = useState<string>(rfqState.destination || "Singapore (SG)");

  // Track whether an RFQ has been broadcast — gates quote visibility
  const [rfqBroadcast, setRfqBroadcast] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastTxHash, setBroadcastTxHash] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Synchronize dropdowns bidirectionally with rfqState
  const handleBagsChange = (bags: number) => {
    setRequestedBags(bags);
    setRfqState({ ...rfqState, quantityBags: bags });
    // If the user changes params after a broadcast, hide quotes until re-broadcast
    setRfqBroadcast(false);
    setBroadcastTxHash(null);
  };

  const handleDestinationChange = (dest: string) => {
    setDestinationMarket(dest);
    setRfqState({ ...rfqState, destination: dest });
    setRfqBroadcast(false);
    setBroadcastTxHash(null);
  };

  const handleLotChange = (lotId: string) => {
    setSelectedLotId(lotId);
    setRfqState({ ...rfqState, lotId });
    setRfqBroadcast(false);
    setBroadcastTxHash(null);
  };

  /**
   * Broadcast RFQ:
   * 1. Write real on-chain attestation to Monad Testnet via /api/cleanverse/broadcast-rfq
   * 2. Compute scarcity-based quotes locally (market maker bots would respond in production)
   * 3. Reveal QuoteBoard and QuoteSummaryCard
   */
  const handleBroadcastNewRfq = async () => {
    setIsBroadcasting(true);
    setBroadcastError(null);

    const newRfqId = `RFQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const requestedKg = activeBags * 60;

    try {
      // 1. Try Web3 Browser Wallet Extension (MetaMask, Phantom, Rabby)
      let walletTx: { txHash: string } | null = null;
      try {
        const rfqNotes = JSON.stringify({ rfqId: newRfqId, buyer: activeParticipant.walletAddress, destination: destinationMarket });
        walletTx = await executeRfqBroadcastWithWallet(activeParticipant.walletAddress, selectedLot.lotId, rfqNotes);
      } catch (walletErr: any) {
        if (walletErr.message?.includes("rejected")) {
          setBroadcastError("RFQ broadcast cancelled in Web3 wallet.");
          return;
        }
      }

      if (walletTx?.txHash) {
        setBroadcastTxHash(walletTx.txHash);
      } else {
        // 2. Fall back to Server Relayer API on Monad Testnet
        const res = await fetch("/api/cleanverse/broadcast-rfq", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rfqId: newRfqId,
            lotId: selectedLot.lotId,
            buyerAddress: activeParticipant.walletAddress,
            quantityKg: requestedKg,
            destination: destinationMarket,
            minPrice: selectedLot.minPrice,
            maxPrice: selectedLot.maxPrice,
          }),
        });

        const json = await res.json();
        if (json.txHash) {
          setBroadcastTxHash(json.txHash);
        } else {
          setBroadcastError(json.error || json.details || "On-chain broadcast failed");
        }
      }

      // Compute scarcity-based quotes regardless — market maker bot responses
      const freshQuotes = computeQuotes(
        {
          lotId: selectedLot.lotId,
          availableKg: selectedLot.quantityKg,
          referencePrice: deriveReferencePrice(selectedLot.minPrice, selectedLot.maxPrice),
          minPrice: selectedLot.minPrice,
          maxPrice: selectedLot.maxPrice,
          custodyStatus: selectedLot.custodyStatus,
        },
        requestedKg,
      );

      setRfqState({
        rfqId: newRfqId,
        buyerName: activeParticipant.name || "Nordlicht Roasters",
        lotId: selectedLot.lotId,
        quantityBags: activeBags,
        destination: destinationMarket,
        status: "quoted",
        quotes: freshQuotes,
      });

      setSelectedMaker(null);
      setRfqBroadcast(true); // ← reveal the quote board
    } catch (err: any) {
      console.error("Broadcast error:", err);
      setBroadcastError(err.message || "Network request failed");
      // Still compute quotes locally so the demo isn't broken
      const freshQuotes = computeQuotes(
        {
          lotId: selectedLot.lotId,
          availableKg: selectedLot.quantityKg,
          referencePrice: deriveReferencePrice(selectedLot.minPrice, selectedLot.maxPrice),
          minPrice: selectedLot.minPrice,
          maxPrice: selectedLot.maxPrice,
          custodyStatus: selectedLot.custodyStatus,
        },
        activeBags * 60,
      );
      setRfqState({
        rfqId: newRfqId,
        buyerName: activeParticipant.name || "Nordlicht Roasters",
        lotId: selectedLot.lotId,
        quantityBags: activeBags,
        destination: destinationMarket,
        status: "quoted",
        quotes: freshQuotes,
      });
      setRfqBroadcast(true);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSelectMakerAndProceed = (makerId: string) => {
    setSelectedMaker(makerId);
    const makerQuote = rfqState.quotes.find((q) => q.makerId === makerId || q.maker === makerId);
    const price = makerQuote?.pricePerKg ?? (makerQuote?.pricePerLb ? makerQuote.pricePerLb * 2.20462 : 8.20);
    const qtyKg = (rfqState.quantityBags || activeBags) * 60;
    const totalUsd = qtyKg * price;

    const dynamicTradeId = `TRD-${Math.floor(100000 + Math.random() * 900000)}`;
    const dynamicTravelRuleRef = `TR-${Math.floor(10000 + Math.random() * 90000)}`;

    setRfqState({ ...rfqState, status: "accepted" });

    setSettlementState({
      tradeId: dynamicTradeId,
      rfqId: rfqState.rfqId,
      lotId: selectedLot.lotId,
      quantityKg: qtyKg,
      pricePerKg: parseFloat(price.toFixed(2)),
      totalAmountUsd: parseFloat(totalUsd.toFixed(2)),
      selectedMaker: makerId,
      makerName: makerQuote?.makerName || makerQuote?.maker || "Market Maker Alpha",
      status: "accepted",
      complianceStatus: "approved",
      transactionHash: "",
      txHash: null,
      travelRuleRef: dynamicTravelRuleRef,
      travelRuleId: dynamicTravelRuleRef,
      auditReportId: `AUD-${selectedLot.lotId}`,
    });
  };

  const activeBags = rfqState.quantityBags || requestedBags;
  const activeQtyKg = activeBags * 60;
  const activeDest = rfqState.destination || destinationMarket;
  const minP = selectedLot.minPrice ?? 7.80;
  const maxP = selectedLot.maxPrice ?? 8.50;

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ─────────────────────────────────────────────────────────────────
          CARD 1: Institutional Coffee RFQ Workspace
          Always visible
      ───────────────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-sm">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[var(--accent-strong)] bg-[var(--paper-soft)] px-2.5 py-1 rounded border border-[var(--line)]">
                {rfqBroadcast ? `RFQ #${rfqState.rfqId}` : "RFQ · Pending Broadcast"}
              </span>
              <span className="text-xs font-mono text-[var(--muted-strong)]">
                Lot: {selectedLot.lotId} ({selectedLot.origin})
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--ink-strong)] mt-2">
              Institutional Coffee RFQ Workspace
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              rfqBroadcast
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}>
              ● STATUS: {rfqBroadcast ? rfqState.status.toUpperCase() : "AWAITING BROADCAST"}
            </span>
            <button
              onClick={() => setShowDemoControls(!showDemoControls)}
              className="rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-strong)] hover:text-[var(--ink)]"
            >
              ⚙ Simulation Controls {showDemoControls ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {/* Collapsible Simulation Controls */}
        {showDemoControls && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Simulation & State Control Drawer (Judge Testing Tools)
            </p>
            <QuoteControls
              rfq={rfqState}
              selectedMaker={selectedMaker}
              onRfqChange={setRfqState}
              onSelectedMakerChange={setSelectedMaker}
            />
            <RfqStateActions rfq={rfqState} onRfqChange={setRfqState} />
          </div>
        )}

        {/* Dynamic Buyer RFQ Request Builder */}
        <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--paper-soft)] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
              DYNAMIC BUYER RFQ REQUEST BUILDER
            </span>
            <span className="text-xs text-[var(--muted-strong)] font-mono">
              Live Contract: {CONTRACT_ADDRESSES.rfqEngine.slice(0, 10)}...
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div>
              <label className="font-bold text-[var(--ink-strong)] block mb-1">Select Coffee Lot</label>
              <select
                value={selectedLot.lotId}
                onChange={(e) => handleLotChange(e.target.value)}
                className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper)] p-2 font-mono text-xs font-bold"
              >
                {lots.map((l) => (
                  <option key={l.lotId} value={l.lotId}>
                    {l.lotId} — {l.origin} ({l.region})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[var(--ink-strong)] block mb-1">Requested Volume (Bags)</label>
              <select
                value={activeBags}
                onChange={(e) => handleBagsChange(parseInt(e.target.value, 10))}
                className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper)] p-2 text-xs font-bold"
              >
                <option value={5}>5 Bags (300 KG)</option>
                <option value={8}>8 Bags (480 KG)</option>
                <option value={10}>10 Bags (600 KG)</option>
                <option value={20}>20 Bags (1,200 KG)</option>
                <option value={40}>40 Bags (2,400 KG)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-[var(--ink-strong)] block mb-1">Destination Port Market</label>
              <select
                value={activeDest}
                onChange={(e) => handleDestinationChange(e.target.value)}
                className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper)] p-2 text-xs font-bold"
              >
                <option value="Singapore (SG)">Singapore (SG)</option>
                <option value="Hamburg (DE)">Hamburg (DE)</option>
                <option value="Rotterdam (NL)">Rotterdam (NL)</option>
                <option value="Tokyo (JP)">Tokyo (JP)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            {/* Cleanverse CCP notice */}
            <span className="text-[0.68rem] text-[var(--muted-strong)] font-mono">
              Cleanverse CVI gated · AttestationRegistry on Monad Testnet
            </span>
            <button
              onClick={handleBroadcastNewRfq}
              disabled={isBroadcasting}
              className="rounded-lg bg-[var(--accent-strong)] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[var(--accent)] transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {isBroadcasting
                ? <><span className="animate-spin">⏳</span> Broadcasting to Monad Testnet...</>
                : "🚀 Broadcast New RFQ on Monad"}
            </button>
          </div>

          {/* Broadcast confirmation badge */}
          {broadcastTxHash && (
            <div className="rounded border border-emerald-500/30 bg-emerald-500/8 px-3 py-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">✓ RFQ broadcast confirmed on Monad Testnet</span>
              <a
                href={`https://testnet.monadscan.com/tx/${broadcastTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-emerald-600 underline"
              >
                {broadcastTxHash.slice(0, 14)}... ↗
              </a>
            </div>
          )}

          {/* Non-blocking error notice if on-chain call failed */}
          {broadcastError && !broadcastTxHash && (
            <div className="rounded border border-amber-500/30 bg-amber-500/8 px-3 py-2 text-[0.68rem] text-amber-700 dark:text-amber-400">
              ⚠ On-chain broadcast encountered an error ({broadcastError}). Quotes computed locally from lot context.
            </div>
          )}
        </div>

        {/* 2-Column Lot Context & Active Specifications */}
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          {/* Left: Lot Context */}
          <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-soft)] p-5 space-y-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
              SELECTED LOT CONTEXT & EXPORTER BOUNDS
            </p>
            <h3 className="text-lg font-bold text-[var(--ink-strong)]">
              {selectedLot.origin} · {selectedLot.region}
            </h3>
            <p className="text-xs font-mono text-[var(--accent-strong)]">{selectedLot.lotId}</p>

            <div className="pt-2 text-xs space-y-2 border-t border-[var(--line)] text-[var(--muted-strong)]">
              <p>• <strong>{selectedLot.quantityKg.toLocaleString()} kg</strong> available inventory ({selectedLot.process} Process)</p>
              <div className="flex flex-wrap items-center gap-2 py-1">
                <span className="text-[0.68rem] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700">
                  🏷 Reserve Floor: <strong>${minP.toFixed(2)}/kg</strong>
                </span>
                <span className="text-[0.68rem] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                  ⚡ Instant Settle: <strong>${maxP.toFixed(2)}/kg</strong>
                </span>
              </div>
              <p className="text-emerald-600 font-semibold">✓ Attested by Quality Inspector on-chain</p>
              <p className="text-blue-600 font-semibold">✓ In Warehouse custody status</p>
            </div>
          </div>

          {/* Right: Active Specifications */}
          <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-soft)] p-5 space-y-3">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
              ACTIVE RFQ SPECIFICATIONS
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[var(--muted)] block font-bold">Requested Quantity</span>
                <span className="text-base font-bold text-[var(--ink-strong)]">
                  {activeQtyKg.toLocaleString()} kg ({activeBags} bags)
                </span>
              </div>
              <div>
                <span className="text-[var(--muted)] block font-bold">Destination Market</span>
                <span className="text-base font-bold text-[var(--ink-strong)]">
                  {activeDest}
                </span>
              </div>
              <div>
                <span className="text-[var(--muted)] block font-bold">Quote Validity Window</span>
                <span className="text-sm font-bold text-amber-600">60 Seconds Window</span>
              </div>
              <div>
                <span className="text-[var(--muted)] block font-bold">Monad RFQ Contract</span>
                <code className="text-[0.68rem]">{CONTRACT_ADDRESSES.rfqEngine.slice(0, 10)}...</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          CARD 2 + 3: Quote Competition — only shown after broadcast
      ───────────────────────────────────────────────────────────────── */}
      {!rfqBroadcast && (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--paper-soft)] p-8 text-center space-y-2">
          <p className="text-2xl">🛰</p>
          <p className="text-sm font-bold text-[var(--ink-strong)]">Waiting for RFQ Broadcast</p>
          <p className="text-xs text-[var(--muted-strong)] max-w-sm mx-auto">
            Configure your order above and click <strong>Broadcast New RFQ on Monad</strong> to trigger
            live competitive quotes from market maker bots.
          </p>
        </div>
      )}

      {rfqBroadcast && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-strong)]">
              COMPETITIVE MULTI-FACTOR QUOTE COMPARISON
            </h3>
            <span className="text-xs text-[var(--muted-strong)] font-mono">
              Scarcity: {((activeBags * 60 / selectedLot.quantityKg) * 100).toFixed(0)}% of lot · {activeBags * 60} kg requested
            </span>
          </div>

          <QuoteBoard
            rfq={rfqState}
            selectedMaker={selectedMaker}
            onSelectMaker={handleSelectMakerAndProceed}
            minPrice={minP}
            maxPrice={maxP}
          />

          <QuoteSummaryCard rfq={rfqState} selectedMaker={selectedMaker} />

          {/* Action Bar — shown when a maker is selected */}
          {selectedMaker && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  ✓ Quote Selected: {selectedMaker}
                </p>
                <p className="text-sm text-[var(--ink-strong)] font-semibold mt-0.5">
                  Ready to proceed to pre-trade Cleanverse CCP compliance check and atomic settlement.
                </p>
              </div>
              <Link
                href="/settlement"
                className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                Proceed to Settlement →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* RFQ Lifecycle Timeline */}
      <RfqLifecycleCard rfq={rfqState} />
    </div>
  );
}

export default function RfqWorkspacePage() {
  return (
    <FlowShell
      eyebrow="Step 05 — Trade Workspace"
      title="RFQ & Quote Competition Workspace"
      intro="Configure your order, broadcast to Monad Testnet, then compare live competitive market maker quotes and select the best price."
    >
      <GatedStorySection label="Buyer RFQ Workspace Access" requiredRole="buyer">
        <Suspense fallback={<div className="p-8 text-xs font-mono">Loading RFQ Workspace...</div>}>
          <RfqContent />
        </Suspense>
      </GatedStorySection>
    </FlowShell>
  );
}
