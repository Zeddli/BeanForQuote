"use client";

import { FlowShell, GatedStorySection } from "@/components/flow-shell";
import { useFlow } from "@/components/flow-provider";
import Link from "next/link";
import { useState } from "react";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import type { CoffeeLot } from "@/types/domain";

export default function LotRegistryPage() {
  const {
    lots,
    setSelectedLotId,
    activeParticipant,
    isLotVerified,
    isLotMinted,
    mintLotToken,
    updateLotThresholds,
  } = useFlow();

  const [activeTab, setActiveTab] = useState<"minted" | "owned">("minted");

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [minting, setMinting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form state for [+ Register Lot]
  const [newLotId, setNewLotId] = useState("LOT-ETH-042");
  const [origin, setOrigin] = useState("Ethiopia");
  const [region, setRegion] = useState("Yirgacheffe");
  const [quantityKg, setQuantityKg] = useState("2400");
  const [process, setProcess] = useState("Washed");
  const [minPriceInput, setMinPriceInput] = useState("7.80");
  const [maxPriceInput, setMaxPriceInput] = useState("8.50");

  // Threshold edit modal state for individual lots
  const [thresholdLot, setThresholdLot] = useState<CoffeeLot | null>(null);
  const [editMinPrice, setEditMinPrice] = useState("");
  const [editMaxPrice, setEditMaxPrice] = useState("");
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [thresholdSuccessMsg, setThresholdSuccessMsg] = useState<string | null>(null);

  const tokenizedLots = lots.filter((l) => isLotMinted(l.lotId));
  const untokenizedLots = lots.filter((l) => !isLotMinted(l.lotId));

  const isCurrentLotVerified = isLotVerified(newLotId);

  const handleMintLotOnChain = async () => {
    if (!isCurrentLotVerified) {
      setErrorMsg(`Asset Document Verification Required: You must first upload and verify ownership documentation for ${newLotId} in Step 03 (Asset Verification) before tokenizing on-chain.`);
      return;
    }

    setMinting(true);
    setTxHash(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/cleanverse/mint-lot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotRefId: newLotId,
          quantityKg: parseInt(quantityKg, 10) || 2400,
          origin: `${origin} (${region})`,
          process,
          ownerAddress: activeParticipant.walletAddress,
        }),
      });

      const json = await res.json();
      if (json.txHash) {
        setTxHash(json.txHash);
        mintLotToken(newLotId, json.txHash);
        updateLotThresholds(newLotId, parseFloat(minPriceInput) || 0, parseFloat(maxPriceInput) || 0);
        setActiveTab("minted");
      } else {
        setErrorMsg(json.error || json.details || "Failed to broadcast mint transaction");
      }
    } catch (err: any) {
      console.error("Mint lot error:", err);
      setErrorMsg(err.message || "Network request failed");
    } finally {
      setMinting(false);
    }
  };

  const handleOpenThresholdModal = (l: CoffeeLot) => {
    setThresholdLot(l);
    setEditMinPrice(l.minPrice ? l.minPrice.toString() : "7.50");
    setEditMaxPrice(l.maxPrice ? l.maxPrice.toString() : "8.50");
    setThresholdSuccessMsg(null);
  };

  const handleSaveThresholds = async () => {
    if (!thresholdLot) return;
    setSavingThresholds(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      const minVal = parseFloat(editMinPrice) || 0;
      const maxVal = parseFloat(editMaxPrice) || 0;
      updateLotThresholds(thresholdLot.lotId, minVal, maxVal);
      setThresholdSuccessMsg(`✓ Pricing thresholds updated on Monad for ${thresholdLot.lotId}`);
      setTimeout(() => {
        setThresholdLot(null);
      }, 1000);
    } finally {
      setSavingThresholds(false);
    }
  };

  const openMintForLot = (l: CoffeeLot) => {
    setNewLotId(l.lotId);
    setOrigin(l.origin);
    setRegion(l.region);
    setQuantityKg(l.quantityKg.toString());
    setProcess(l.process);
    setMinPriceInput(l.minPrice?.toString() || "7.80");
    setMaxPriceInput(l.maxPrice?.toString() || "8.50");
    setShowRegisterModal(true);
  };

  return (
    <FlowShell
      eyebrow="Step 02"
      title="Coffee Lots & Asset Management"
      intro="Separate view of physical owned coffee assets vs. on-chain tokenized inventory on Monad Testnet."
    >
      <GatedStorySection label="Exporter Lot Registry Access" requiredRole="exporter">
        <div className="space-y-6">
          {/* Top Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
            <div className="flex items-center gap-3 text-sm font-bold">
              <button
                onClick={() => setActiveTab("minted")}
                className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                  activeTab === "minted"
                    ? "bg-[var(--accent-strong)] text-white border-[var(--accent-strong)] shadow"
                    : "bg-[var(--paper-soft)] border-[var(--line)] text-[var(--ink-strong)] hover:bg-[var(--paper)]"
                }`}
              >
                <span>🪙 On-Chain Tokenized Lots</span>
                <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
                  {tokenizedLots.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("owned")}
                className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                  activeTab === "owned"
                    ? "bg-[var(--accent-strong)] text-white border-[var(--accent-strong)] shadow"
                    : "bg-[var(--paper-soft)] border-[var(--line)] text-[var(--ink-strong)] hover:bg-[var(--paper)]"
                }`}
              >
                <span>📦 Physical Owned Assets (Untokenized)</span>
                <span className="text-xs font-mono bg-white/20 px-2 py-0.5 rounded-full">
                  {untokenizedLots.length}
                </span>
              </button>
            </div>

            <button
              onClick={() => setShowRegisterModal(true)}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-all flex items-center gap-1.5"
            >
              + Tokenize Physical Asset
            </button>
          </div>

          {/* Lot Register / Minting Modal */}
          {showRegisterModal && (
            <div className="rounded-xl border border-[var(--accent-strong)] bg-[var(--paper)] p-6 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div>
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    TOKENIZATION WIZARD
                  </span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-strong)] mt-0.5">
                    Tokenize & Mint Coffee Lot ({newLotId})
                  </h3>
                </div>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <label className="font-bold text-[var(--ink-strong)] block mb-1">Select Owned Physical Lot</label>
                  <select
                    value={newLotId}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setNewLotId(selected);
                      const matched = lots.find((l) => l.lotId === selected);
                      if (matched) {
                        setOrigin(matched.origin);
                        setRegion(matched.region);
                        setQuantityKg(matched.quantityKg.toString());
                        setProcess(matched.process);
                        setMinPriceInput(matched.minPrice?.toString() || "7.80");
                        setMaxPriceInput(matched.maxPrice?.toString() || "8.50");
                      }
                    }}
                    className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] p-2 font-mono text-xs font-bold"
                  >
                    {lots.map((l) => (
                      <option key={l.lotId} value={l.lotId}>
                        {l.lotId} — {l.origin} ({l.region}) {isLotMinted(l.lotId) ? "[Minted]" : "[Untokenized]"}
                      </option>
                    ))}
                    <option value="LOT-COL-088">LOT-COL-088 — Colombia (Huila) [Untokenized]</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-[var(--ink-strong)] block mb-1">Quantity (KG)</label>
                  <input
                    type="number"
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--ink-strong)] block mb-1">Origin Country</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-[var(--ink-strong)] block mb-1">Processing Method</label>
                  <input
                    type="text"
                    value={process}
                    onChange={(e) => setProcess(e.target.value)}
                    className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] p-2 text-xs font-bold"
                  />
                </div>

                {/* Exporter Pricing Thresholds */}
                <div>
                  <label className="font-bold text-[var(--ink-strong)] block mb-1">
                    Reserve Floor Min Price ($/kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={minPriceInput}
                    onChange={(e) => setMinPriceInput(e.target.value)}
                    placeholder="e.g. 7.80"
                    className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] p-2 text-xs font-bold"
                  />
                  <span className="text-[0.68rem] text-[var(--muted-strong)]">Minimum price accepted by exporter</span>
                </div>
                <div>
                  <label className="font-bold text-[var(--ink-strong)] block mb-1">
                    Instant Settle Max Price ($/kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={maxPriceInput}
                    onChange={(e) => setMaxPriceInput(e.target.value)}
                    placeholder="e.g. 8.50"
                    className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] p-2 text-xs font-bold"
                  />
                  <span className="text-[0.68rem] text-[var(--muted-strong)]">Target price for fast buyer settlement</span>
                </div>
              </div>

              {/* Asset Verification Gate Status */}
              {!isCurrentLotVerified ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>⚠️ Document Verification Required for {newLotId}</span>
                    <span className="text-[0.68rem] bg-amber-500/20 px-2 py-0.5 rounded font-mono">Unverified</span>
                  </div>
                  <p className="text-[0.72rem] leading-relaxed">
                    Exporters are strictly required to upload and verify coffee lot ownership documentation (Bill of Lading / Phytosanitary Certificate) in <strong>Step 03 (Asset Verification)</strong> before tokenizing this asset on-chain.
                  </p>
                  <div className="pt-1">
                    <Link
                      href={`/lots/${newLotId}`}
                      onClick={() => setSelectedLotId(newLotId)}
                      className="inline-flex items-center gap-1.5 rounded bg-[var(--accent-strong)] px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-[var(--accent)] transition-all"
                    >
                      📜 Go to Step 03: Verify {newLotId} Ownership →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-bold">
                  <span>✓ Asset Document Ownership Verified on Cleanverse CVA</span>
                  <span className="text-[0.68rem] font-mono bg-emerald-500/20 px-2 py-0.5 rounded">Ready to Tokenize</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[var(--muted-strong)] font-mono">
                  Target Contract: <code className="text-[0.68rem]">{CONTRACT_ADDRESSES.coffeeLotToken.slice(0, 10)}...</code>
                </div>
                <button
                  onClick={handleMintLotOnChain}
                  disabled={minting || !isCurrentLotVerified}
                  className="rounded bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {minting ? "Broadcasting to Monad Testnet..." : "Confirm & Mint CVA Token"}
                </button>
              </div>

              {txHash && (
                <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div>
                    <span className="font-bold block">✓ Lot Minted On-Chain on Monad Testnet!</span>
                    <span className="text-[0.68rem] text-emerald-700 dark:text-emerald-400 font-mono">
                      Tx: {txHash}
                    </span>
                  </div>
                  <a
                    href={`https://testnet.monadscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono underline text-[0.72rem] font-bold text-emerald-900 dark:text-emerald-200 hover:text-emerald-600 whitespace-nowrap"
                  >
                    View on Monadscan ↗
                  </a>
                </div>
              )}

              {errorMsg && (
                <div className="rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300 font-semibold">
                  ⚠️ {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* Pricing Threshold Editing Modal */}
          {thresholdLot && (
            <div className="rounded-xl border border-[var(--accent-strong)] bg-[var(--paper)] p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <div>
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    EXPORTER PRICING GOVERNANCE
                  </span>
                  <h3 className="text-base font-bold text-[var(--ink-strong)] mt-0.5">
                    Configure Pricing Thresholds for {thresholdLot.lotId}
                  </h3>
                </div>
                <button
                  onClick={() => setThresholdLot(null)}
                  className="text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="p-3 rounded border border-[var(--line)] bg-[var(--paper-soft)]">
                  <label className="font-bold text-[var(--ink-strong)] block mb-1">
                    🏷 Reserve Floor (Min Price $/kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editMinPrice}
                    onChange={(e) => setEditMinPrice(e.target.value)}
                    className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper)] p-2 text-sm font-bold text-[var(--ink-strong)]"
                  />
                  <p className="text-[0.68rem] text-[var(--muted-strong)] mt-1">
                    Minimum price the exporter will accept. Market maker quotes below this floor are rejected on-chain.
                  </p>
                </div>

                <div className="p-3 rounded border border-amber-500/30 bg-amber-500/5">
                  <label className="font-bold text-[var(--ink-strong)] block mb-1">
                    ⚡ Instant Settle Ceiling (Max Price $/kg)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editMaxPrice}
                    onChange={(e) => setEditMaxPrice(e.target.value)}
                    className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper)] p-2 text-sm font-bold text-[var(--ink-strong)]"
                  />
                  <p className="text-[0.68rem] text-[var(--muted-strong)] mt-1">
                    Target price for instant buyer acceptance badge ("Meets Exporter Target").
                  </p>
                </div>
              </div>

              {thresholdSuccessMsg && (
                <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                  {thresholdSuccessMsg}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[var(--muted-strong)] font-mono">
                  Enforced on Monad RFQEngine
                </span>
                <button
                  onClick={handleSaveThresholds}
                  disabled={savingThresholds}
                  className="rounded bg-[var(--accent-strong)] px-5 py-2 text-xs font-bold text-white shadow hover:bg-[var(--accent)] disabled:opacity-50 transition-all"
                >
                  {savingThresholds ? "Saving Thresholds..." : "💾 Save Thresholds on Monad"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: ON-CHAIN TOKENIZED LOTS */}
          {activeTab === "minted" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-strong)]">
                  ON-CHAIN TOKENIZED INVENTORY (MONAD TESTNET)
                </h3>
                <span className="text-xs text-[var(--muted-strong)]">
                  Live tokenized CoffeeLotToken (`cvCOFFEE`) lots available for RFQ trading
                </span>
              </div>

              {tokenizedLots.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--paper-soft)] p-8 text-center space-y-3">
                  <p className="text-sm font-bold text-[var(--ink-strong)]">No On-Chain Tokenized Lots Yet</p>
                  <p className="text-xs text-[var(--muted-strong)] max-w-md mx-auto">
                    You have physical coffee lots in warehouse custody. Verify their ownership documentation in Step 03 and click <strong>Tokenize & Mint CVA Asset</strong> to launch on-chain.
                  </p>
                  <button
                    onClick={() => setActiveTab("owned")}
                    className="rounded bg-[var(--accent-strong)] px-4 py-2 text-xs font-bold text-white shadow"
                  >
                    View Physical Owned Assets →
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {tokenizedLots.map((l) => {
                    const verified = isLotVerified(l.lotId);
                    return (
                      <div
                        key={l.lotId}
                        className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-5 shadow-sm transition-all space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-[var(--accent-strong)] bg-[var(--paper-soft)] px-2 py-0.5 rounded border border-[var(--line)]">
                                {l.lotId}
                              </span>
                              <h3 className="text-lg font-bold text-[var(--ink-strong)]">
                                {l.origin} · {l.region}
                              </h3>
                              <span className="text-[0.68rem] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                ✓ Tokenized Asset (Monad 10143)
                              </span>
                            </div>
                            <p className="text-xs text-[var(--muted-strong)] mt-1">
                              <strong>{l.quantityKg.toLocaleString()} kg</strong> ({Math.round(l.quantityKg / 60)} bags) · {l.process} Process · 2026 Harvest
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenThresholdModal(l)}
                              className="rounded-lg border border-[var(--line-strong)] bg-[var(--paper-soft)] px-3 py-2 text-xs font-bold text-[var(--ink-strong)] hover:bg-[var(--paper)] hover:border-[var(--accent-strong)] transition-all flex items-center gap-1"
                            >
                              ⚙ Thresholds
                            </button>

                            <Link
                              href={`/lots/${l.lotId}`}
                              onClick={() => setSelectedLotId(l.lotId)}
                              className="rounded-lg bg-[var(--paper-soft)] border border-[var(--line-strong)] px-4 py-2 text-xs font-bold text-[var(--ink-strong)] hover:bg-[var(--paper)] hover:border-[var(--accent-strong)] transition-all"
                            >
                              View Lot & Certificate →
                            </Link>
                          </div>
                        </div>

                        {/* Exporter Pricing Bounds Badge Bar */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          <span className="text-[0.72rem] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700">
                            🏷 Reserve Floor: <strong>${l.minPrice ? l.minPrice.toFixed(2) : "7.50"}/kg</strong>
                          </span>
                          <span className="text-[0.72rem] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                            ⚡ Instant Settle: <strong>${l.maxPrice ? l.maxPrice.toFixed(2) : "8.50"}/kg</strong>
                          </span>
                          <span className="text-[0.68rem] text-[var(--muted-strong)] font-mono ml-auto">
                            Token: CoffeeLotToken (cvCOFFEE)
                          </span>
                        </div>

                        <div className="flex items-center gap-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted-strong)]">
                          <span className="text-emerald-600 font-semibold">✓ Document Attestation Verified</span>
                          <span>• Custody: in-warehouse</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHYSICAL OWNED ASSETS (UNTOKENIZED) */}
          {activeTab === "owned" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--ink-strong)]">
                  PHYSICAL OWNED COFFEE ASSETS (WAREHOUSE RECEIPTS)
                </h3>
                <span className="text-xs text-[var(--muted-strong)]">
                  Physical inventory owned by Exporter — require CVA document verification before tokenizing on-chain
                </span>
              </div>

              {untokenizedLots.length === 0 ? (
                <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-emerald-600">All owned physical assets have been tokenized on-chain!</p>
                  <p className="text-xs text-[var(--muted-strong)]">
                    All physical warehouse lots are currently minted and active on Monad Testnet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {untokenizedLots.map((l) => {
                    const verified = isLotVerified(l.lotId);
                    return (
                      <div
                        key={l.lotId}
                        className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-[var(--accent-strong)] bg-[var(--paper-soft)] px-2 py-0.5 rounded border border-[var(--line)]">
                                {l.lotId}
                              </span>
                              <h3 className="text-lg font-bold text-[var(--ink-strong)]">
                                {l.origin} · {l.region}
                              </h3>
                              <span className="text-[0.68rem] font-bold text-slate-600 bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">
                                Untokenized Physical Asset
                              </span>
                            </div>
                            <p className="text-xs text-[var(--muted-strong)] mt-1">
                              <strong>{l.quantityKg.toLocaleString()} kg</strong> ({Math.round(l.quantityKg / 60)} bags) · {l.process} Process · 2026 Harvest
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {verified ? (
                              <button
                                onClick={() => openMintForLot(l)}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-all flex items-center gap-1.5"
                              >
                                🪙 Tokenize Asset (Mint CVA Token)
                              </button>
                            ) : (
                              <Link
                                href={`/lots/${l.lotId}`}
                                onClick={() => setSelectedLotId(l.lotId)}
                                className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[var(--accent)] transition-all flex items-center gap-1.5"
                              >
                                📜 Upload Ownership Document →
                              </Link>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted-strong)]">
                          {verified ? (
                            <span className="text-emerald-600 font-semibold">
                              ✓ Cleanverse CVA Document Verified — Ready for On-Chain Tokenization
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold">
                              ⚠️ Pending Ownership Document Upload in Step 03 (Asset Verification)
                            </span>
                          )}
                          <span>• Custody: in-warehouse</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </GatedStorySection>
    </FlowShell>
  );
}
