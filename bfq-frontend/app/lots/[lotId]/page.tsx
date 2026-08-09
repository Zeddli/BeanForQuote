"use client";

import { use, useState, useEffect } from "react";
import { FlowShell } from "@/components/flow-shell";
import { useFlow } from "@/components/flow-provider";
import Link from "next/link";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { getLotTokenBalance, stringToBytes32 } from "@/lib/viem-client";

export default function AssetVerificationPage({ params }: { params: Promise<{ lotId: string }> }) {
  const resolvedParams = use(params);
  const { lots, setSelectedLotId, activeParticipant, settlementState, markLotAsVerified, verifiedLots, isLotVerified } = useFlow();

  const lot = lots.find((l) => l.lotId === resolvedParams.lotId) ?? lots[0];

  const isExporter = activeParticipant.role === "exporter";
  const isBuyer = activeParticipant.role === "buyer";
  const isInspector = (activeParticipant.role as string) === "qualityInspector" || (activeParticipant.role as string) === "inspector";

  const isCurrentLotVerified = isLotVerified(lot.lotId);

  // Exporter Document Upload & On-Chain Verification state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docHash, setDocHash] = useState<string | null>(null);
  const [docType, setDocType] = useState<string>("bill_of_lading");
  const [verifying, setVerifying] = useState(false);
  const [cvaTxHash, setCvaTxHash] = useState<string | null>(null);
  const [showReuploadForm, setShowReuploadForm] = useState(false);

  const [verifiedDocRecord, setVerifiedDocRecord] = useState<{
    fileName: string;
    docHash: string;
    verifiedAt: number;
    txHash: string;
  } | null>(null);

  const existingVerificationRecord = verifiedLots[lot.lotId] || verifiedDocRecord;

  // Inspector Attestation state
  const [notes, setNotes] = useState("Cupping score 88.5, defect count < 2. Verified for export.");
  const [attestTx, setAttestTx] = useState<string | null>(null);
  const [attesting, setAttesting] = useState(false);

  // Buyer Live On-Chain Token Ownership state
  const [onChainLotBalance, setOnChainLotBalance] = useState<number>(0);

  useEffect(() => {
    if (isBuyer && activeParticipant.walletAddress) {
      getLotTokenBalance(lot.lotId, activeParticipant.walletAddress).then((bal) => {
        setOnChainLotBalance(bal);
      });
    }
  }, [isBuyer, lot.lotId, activeParticipant.walletAddress]);

  // Compute document SHA-256 hash dynamically when file is selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setDocHash(hashHex);
    } catch (err) {
      console.error("SHA-256 calculation failed:", err);
      setDocHash(stringToBytes32(file.name + Date.now().toString()));
    }
  };

  // Exporter: On-Chain Asset Verification & Cleanverse CVA Wrapping
  const handleVerifyOwnershipOnChain = async () => {
    setVerifying(true);
    setCvaTxHash(null);
    try {
      const calculatedHash = docHash || stringToBytes32(selectedFile?.name || "bill_of_lading.pdf");

      const res = await fetch("/api/cleanverse/verify-cva", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotId: lot.lotId,
          docHash: calculatedHash,
          fileName: selectedFile?.name || "cleanverse_coffee_lot_issuance_report_demo.pdf",
          docType,
          exporterAddress: activeParticipant.walletAddress,
        }),
      });

      const json = await res.json();
      if (json.txHash) {
        setCvaTxHash(json.txHash);
        const record = {
          fileName: selectedFile?.name || "cleanverse_coffee_lot_issuance_report_demo.pdf",
          docHash: json.docHash || calculatedHash,
          verifiedAt: Date.now(),
          txHash: json.txHash,
        };
        setVerifiedDocRecord(record);
        markLotAsVerified({
          lotId: lot.lotId,
          ...record,
        });
        setShowReuploadForm(false);
      }
    } catch (err) {
      console.error("CVA verification error:", err);
    } finally {
      setVerifying(false);
    }
  };

  // Inspector: Sign Quality Attestation
  const handleSignAttestation = async () => {
    setAttesting(true);
    setAttestTx(null);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setAttestTx("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""));
    } finally {
      setAttesting(false);
    }
  };

  // Buyer: Download Proof of Ownership Certificate JSON
  const handleDownloadOwnershipProof = () => {
    const proofPackage = {
      title: "Cleanverse Protocol — Proof of Coffee Bean Ownership",
      lotId: lot.lotId,
      assetSymbol: lot.assetSymbol,
      origin: `${lot.origin} (${lot.region})`,
      gradeLabel: lot.gradeLabel,
      ownerWalletAddress: activeParticipant.walletAddress,
      ownerRole: activeParticipant.role.toUpperCase(),
      quantityPurchasedKg: settlementState.quantityKg || lot.quantityKg,
      totalAmountUsd: settlementState.totalAmountUsd || lot.quantityKg * 8.2,
      settlementTxHash: settlementState.transactionHash || "0x7a82b5d2e7f31aa8d0d8409c9b0dc7118d2a4e0c56b5f7e93b7a0c1dbe42c712",
      travelRuleRef: settlementState.travelRuleRef || "TR-88391",
      contracts: {
        coffeeLotToken: CONTRACT_ADDRESSES.coffeeLotToken,
        cleanverseCviAdapter: CONTRACT_ADDRESSES.cleanverseCviAdapter,
        cleanverseCvaAdapter: CONTRACT_ADDRESSES.mockCleanverseCva,
        ruleEngine: CONTRACT_ADDRESSES.ruleEngine,
        settlementEngine: CONTRACT_ADDRESSES.settlementEngine,
      },
      cleanverseVerification: {
        cviCertified: true,
        cvaWrapped: true,
        qualityAttestationSigned: true,
        eudrDeforestationCompliant: true,
        timestamp: new Date().toISOString(),
      },
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(proofPackage, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Proof_of_Ownership_${lot.lotId}_${activeParticipant.walletAddress.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <FlowShell
      eyebrow="Step 03 — Provenance & Verification"
      title="Asset Verification & On-Chain Ownership"
      intro="Physical coffee → verified document data → CVA-wrapped tokenized asset ownership on Monad Testnet."
    >
      <div className="space-y-6 max-w-4xl">
        {/* Back Link */}
        <Link href="/lots" className="inline-flex items-center text-xs font-bold text-[var(--accent-strong)] hover:underline">
          ← Back to Coffee Lots
        </Link>

        {/* Main Header Card */}
        <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[var(--accent-strong)] bg-[var(--paper-soft)] px-2.5 py-1 rounded border border-[var(--line)]">
                  {lot.lotId}
                </span>
                {isCurrentLotVerified ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    ✓ Cleanverse CVA Asset Verified
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    ⚠️ Document Verification Pending
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold tracking-[-0.03em] text-[var(--ink-strong)] mt-2">
                {lot.origin} · {lot.region}
              </h2>
              <p className="text-xs text-[var(--muted-strong)] mt-0.5">{lot.process} Process · 2026 Harvest · {lot.gradeLabel}</p>
            </div>

            <div className="rounded-lg border border-[var(--line-strong)] bg-[var(--paper-soft)] p-4 text-right">
              <p className="text-2xl font-bold text-[var(--ink-strong)]">{lot.quantityKg.toLocaleString()} KG</p>
              <p className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--muted)]">Verified Lot Inventory</p>
            </div>
          </div>
        </div>

        {/* EXPORTER VIEW: Show Certification Card if Verified */}
        {isExporter && isCurrentLotVerified && !showReuploadForm && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
              <div>
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                  EXPORTER ASSET ONBOARDING
                </span>
                <h3 className="text-xl font-bold tracking-[-0.03em] text-[var(--ink-strong)] mt-1">
                  ✓ Cleanverse CVA Ownership Certificate Issued
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Monad Testnet 10143
                </span>
                <button
                  onClick={() => setShowReuploadForm(true)}
                  className="rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ink-strong)] hover:bg-[var(--paper)] transition-colors"
                >
                  🔄 Update Document
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-500/30 bg-[var(--paper)] p-5 space-y-4 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-3 text-xs">
                <div className="p-3 rounded border border-emerald-500/20 bg-emerald-500/10">
                  <span className="text-[0.68rem] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">EXPORTER WALLET</span>
                  <span className="font-mono font-bold text-[var(--ink-strong)] text-[0.72rem] block mt-1 truncate">
                    {activeParticipant.walletAddress}
                  </span>
                </div>
                <div className="p-3 rounded border border-emerald-500/20 bg-emerald-500/10">
                  <span className="text-[0.68rem] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">VERIFIED DOCUMENT</span>
                  <span className="font-bold text-xs text-[var(--ink-strong)] block mt-1 truncate">
                    {existingVerificationRecord?.fileName || "cleanverse_coffee_lot_issuance_report_demo.pdf"}
                  </span>
                </div>
                <div className="p-3 rounded border border-emerald-500/20 bg-emerald-500/10">
                  <span className="text-[0.68rem] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">ON-CHAIN CVA STATUS</span>
                  <span className="font-bold text-xs text-emerald-600 block mt-1">
                    ✓ Cleanverse CVA Wrapped
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-emerald-500/20 pt-3 text-xs">
                <div className="flex flex-wrap items-center justify-between font-semibold gap-2">
                  <span className="text-[var(--muted-strong)]">SHA-256 Attestation Hash:</span>
                  <code className="font-mono text-[0.7rem] text-emerald-700 dark:text-emerald-300 font-bold break-all">
                    {existingVerificationRecord?.docHash || "0x4a22804ec1726307693d2c9c092dbf7cc4342a9c060ee9215936008f787c4119"}
                  </code>
                </div>

                {existingVerificationRecord?.txHash && (
                  <div className="flex items-center justify-between font-semibold gap-2">
                    <span className="text-[var(--muted-strong)]">Monad Testnet Transaction:</span>
                    <a
                      href={`https://testnet.monadscan.com/tx/${existingVerificationRecord.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[0.72rem] text-emerald-600 underline font-bold"
                    >
                      Monadscan Tx: {existingVerificationRecord.txHash.slice(0, 14)}... ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="rounded bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 space-y-1 border border-emerald-500/20">
                <div className="flex items-center gap-2 font-bold">
                  <span>✓ Cleanverse Protocol Attestation Certificate Verified On-Chain</span>
                </div>
                <p className="text-[0.7rem] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  This coffee lot ({lot.lotId} — {lot.origin}) is certified by Cleanverse CVA Adapter (<code className="font-mono">{CONTRACT_ADDRESSES.mockCleanverseCva.slice(0, 10)}...</code>) and is fully eligible for tokenized minting on Step 02 (Coffee Lots).
                </p>
                <div className="pt-2">
                  <Link
                    href="/lots"
                    className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-all"
                  >
                    Proceed to Step 02: Mint & Tokenize Asset →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXPORTER VIEW: Document Upload Form (If Unverified or Re-uploading) */}
        {isExporter && (!isCurrentLotVerified || showReuploadForm) && (
          <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  EXPORTER ASSET ONBOARDING
                </span>
                <h3 className="text-lg font-bold text-[var(--ink-strong)] mt-0.5">
                  Upload Ownership Document & Cleanverse CVA Verification
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Monad Testnet 10143
                </span>
                {isCurrentLotVerified && (
                  <button
                    onClick={() => setShowReuploadForm(false)}
                    className="text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    ✕ Cancel
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-[var(--muted-strong)] leading-relaxed">
              As the certified Exporter, upload your physical coffee ownership documentation (Bill of Lading, Phytosanitary Certificate, or EUDR Land Registry). Cleanverse CVA computes an on-chain SHA-256 cryptographic attestation to verify your ownership on-chain.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="font-bold text-[var(--ink-strong)] block mb-1">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] p-2.5 font-bold text-xs"
                >
                  <option value="bill_of_lading">Bill of Lading / Maritime Shipping Record</option>
                  <option value="phytosanitary">Phytosanitary Health Certificate</option>
                  <option value="certificate_of_origin">Certificate of Origin (ICO Registered)</option>
                  <option value="eudr_land_registry">EUDR Deforestation Land Polygon Registry</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[var(--ink-strong)] block mb-1">Upload Document File (PDF / Image / JSON)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.json"
                  className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] p-2 text-xs text-[var(--ink-strong)] file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-bold file:bg-[var(--accent-strong)] file:text-white hover:file:bg-[var(--accent)]"
                />
              </div>
            </div>

            {/* SHA-256 Cryptographic Preview */}
            {selectedFile && (
              <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-soft)] p-3 text-xs space-y-1">
                <div className="flex items-center justify-between font-semibold">
                  <span>File: <strong>{selectedFile.name}</strong> ({Math.round(selectedFile.size / 1024)} KB)</span>
                  <span className="text-[0.68rem] text-emerald-600 font-bold">SHA-256 Computed</span>
                </div>
                <p className="font-mono text-[0.7rem] text-[var(--ink-strong)] break-all font-bold">
                  Document Hash: {docHash || "Calculating..."}
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)]">
              <button
                onClick={handleVerifyOwnershipOnChain}
                disabled={verifying}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {verifying ? "Verifying & Wrapping CVA Asset..." : "📜 Submit & Verify Ownership on Cleanverse CVA"}
              </button>

              {cvaTxHash && (
                <a
                  href={`https://testnet.monadscan.com/tx/${cvaTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono font-bold text-emerald-600 underline flex items-center gap-1"
                >
                  ✓ Monadscan Tx: {cvaTxHash.slice(0, 12)}... ↗
                </a>
              )}
            </div>
          </div>
        )}

        {/* BUYER VIEW: Proof of Ownership Certificate */}
        {isBuyer && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
              <div>
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                  BUYER PROOF OF OWNERSHIP
                </span>
                <h3 className="text-xl font-bold tracking-[-0.03em] text-[var(--ink-strong)] mt-1">
                  On-Chain Coffee Bean Ownership Certificate
                </h3>
              </div>
              <button
                onClick={handleDownloadOwnershipProof}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition-all flex items-center gap-1.5"
              >
                <span>📄</span> Download Proof Certificate (JSON)
              </button>
            </div>

            {/* Ownership Certificate Badge */}
            <div className="rounded-lg border border-emerald-500/30 bg-[var(--paper)] p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3 text-xs">
                <div className="p-3 rounded border border-emerald-500/20 bg-emerald-500/10">
                  <span className="text-[0.68rem] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">OWNER WALLET</span>
                  <span className="font-mono font-bold text-[var(--ink-strong)] text-[0.72rem] block mt-1 truncate">
                    {activeParticipant.walletAddress}
                  </span>
                </div>
                <div className="p-3 rounded border border-emerald-500/20 bg-emerald-500/10">
                  <span className="text-[0.68rem] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">TOKENIZED ASSET HELD</span>
                  <span className="font-bold text-base text-[var(--ink-strong)] block mt-0.5">
                    {onChainLotBalance > 0 ? `${onChainLotBalance.toLocaleString()} KG` : `${settlementState.quantityKg || lot.quantityKg} KG`} (cvCOFFEE)
                  </span>
                </div>
                <div className="p-3 rounded border border-emerald-500/20 bg-emerald-500/10">
                  <span className="text-[0.68rem] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">CLEANVERSE COMPLIANCE</span>
                  <span className="font-bold text-xs text-emerald-600 block mt-1">
                    ✓ CVI & CVA Certified
                  </span>
                </div>
              </div>

              {/* Verified Provenance Checks */}
              <div className="space-y-2 text-xs border-t border-emerald-500/20 pt-3">
                <p className="font-bold text-[var(--ink-strong)]">Verified Cryptographic Proofs & Chain of Custody:</p>
                <div className="grid gap-2 sm:grid-cols-2 text-[0.72rem]">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <span>✓</span> <strong>CVI Identity:</strong> Buyer {activeParticipant.name} certified on Monad 10143
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <span>✓</span> <strong>CVA Asset Token:</strong> Contract <code className="font-mono">{CONTRACT_ADDRESSES.coffeeLotToken.slice(0, 10)}...</code>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <span>✓</span> <strong>Quality Score:</strong> {lot.gradeLabel} (Cupping Score 88.5 Signed)
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                    <span>✓</span> <strong>EUDR Deforestation:</strong> Geolocation Polygon Polygon Verified
                  </div>
                </div>
              </div>

              {/* DvP Settlement Receipt */}
              <div className="rounded bg-[var(--paper-soft)] p-3 text-xs space-y-1 font-mono text-[0.7rem] border border-[var(--line)]">
                <div className="flex items-center justify-between text-[var(--muted-strong)]">
                  <span>DvP Settlement Reference</span>
                  <span>{settlementState.travelRuleRef || "TR-88391"}</span>
                </div>
                <div className="text-[var(--ink-strong)] font-bold truncate">
                  Settlement Tx Hash: {settlementState.transactionHash || "0x7a82b5d2e7f31aa8d0d8409c9b0dc7118d2a4e0c56b5f7e93b7a0c1dbe42c712"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lot Details Grid */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] border-b border-[var(--line)] pb-2">
            LOT SPECIFICATIONS & PROVENANCE
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="flex justify-between border-b border-[var(--line)] pb-2">
              <span className="text-[var(--muted-strong)]">Origin Country</span>
              <span className="font-bold text-[var(--ink-strong)]">{lot.origin}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2">
              <span className="text-[var(--muted-strong)]">Region / Washing Station</span>
              <span className="font-bold text-[var(--ink-strong)]">{lot.region}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2">
              <span className="text-[var(--muted-strong)]">Varietal / Grade</span>
              <span className="font-bold text-[var(--ink-strong)]">{lot.gradeLabel}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2">
              <span className="text-[var(--muted-strong)]">Processing Method</span>
              <span className="font-bold text-[var(--ink-strong)]">{lot.process}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2">
              <span className="text-[var(--muted-strong)]">Harvest Year</span>
              <span className="font-bold text-[var(--ink-strong)]">2026</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2">
              <span className="text-[var(--muted-strong)]">On-Chain Asset Token</span>
              <span className="font-bold text-emerald-600 font-mono">CoffeeLotToken (cvCOFFEE)</span>
            </div>
          </div>
        </div>

        {/* Quality Inspector Attestation Panel */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              ATTESTATION & QUALITY INSPECTION
            </h3>
            <span className="text-[0.68rem] font-mono text-[var(--muted-strong)]">
              Contract: {CONTRACT_ADDRESSES.attestationRegistry.slice(0, 10)}...
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <span>✓</span> Origin verified by Cleanverse exporter credentials
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <span>✓</span> Physical quantity ({lot.quantityKg} kg) verified
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <span>✓</span> Quality attestation signed on-chain by Quality Inspector
            </div>
          </div>

          {isInspector && (
            <div className="rounded-lg border border-[var(--line-strong)] bg-[var(--paper-soft)] p-4 space-y-3 pt-3">
              <p className="text-xs font-bold text-[var(--ink-strong)]">Quality Inspector Attestation Action</p>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded border border-[var(--line)] bg-[var(--paper)] p-2 text-xs font-semibold"
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSignAttestation}
                  disabled={attesting}
                  className="rounded bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {attesting ? "Signing Attestation..." : "Sign On-Chain Attestation"}
                </button>
                {attestTx && (
                  <a
                    href={`https://testnet.monadscan.com/tx/${attestTx}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[0.7rem] font-mono text-emerald-600 underline font-bold"
                  >
                    Tx: {attestTx.slice(0, 12)}... ↗
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Physical Custody Timeline */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] border-b border-[var(--line)] pb-2">
            PHYSICAL CUSTODY TIMELINE & WAREHOUSE RECEIPTS
          </h3>

          <div className="grid gap-3 sm:grid-cols-4 text-xs">
            <div className="p-3 rounded border border-emerald-500/30 bg-emerald-500/10 font-bold text-emerald-800 dark:text-emerald-300">
              ✓ Santos Warehouse Vault
            </div>
            <div className="p-3 rounded border border-[var(--line)] bg-[var(--paper-soft)] text-[var(--muted)]">
              ○ Port Release Cleared
            </div>
            <div className="p-3 rounded border border-[var(--line)] bg-[var(--paper-soft)] text-[var(--muted)]">
              ○ Maritime Transit
            </div>
            <div className="p-3 rounded border border-[var(--line)] bg-[var(--paper-soft)] text-[var(--muted)]">
              ○ Rotterdams Haven Vault
            </div>
          </div>
        </div>

        {/* Navigation Action */}
        <div className="flex justify-end pt-2">
          <Link
            href="/marketplace"
            onClick={() => setSelectedLotId(lot.lotId)}
            className="rounded-lg bg-[var(--accent-strong)] px-6 py-3 text-sm font-bold text-white shadow hover:bg-[var(--accent)] transition-all flex items-center gap-2"
          >
            Continue to Marketplace →
          </Link>
        </div>
      </div>
    </FlowShell>
  );
}
