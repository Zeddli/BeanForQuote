"use client";

import { useState } from "react";

interface FaucetPaymentWidgetProps {
  walletAddress: string;
  walletLabel?: string;
  compact?: boolean;
}

export function FaucetPaymentWidget({
  walletAddress,
  walletLabel,
  compact = false,
}: FaucetPaymentWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successAmount, setSuccessAmount] = useState<string | null>(null);

  const handleRequestFaucet = async () => {
    if (!walletAddress) return;
    setLoading(true);
    setErrorMsg(null);
    setTxHash(null);

    try {
      const res = await fetch("/api/cleanverse/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, amountAusdc: "10" }),
      });

      const json = await res.json();
      if (json.txHash) {
        setTxHash(json.txHash);
        setSuccessAmount(json.amountAusdc || "10");
      } else {
        setErrorMsg(json.error || json.details || "Faucet transaction failed");
      }
    } catch (err: any) {
      console.error("[AUSDC Faucet Payment Error]:", err);
      setErrorMsg(err.message || "Network error requesting faucet");
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="inline-flex flex-wrap items-center gap-2">
        <button
          onClick={handleRequestFaucet}
          disabled={loading || !walletAddress}
          className="rounded bg-emerald-600 px-3 py-1 text-[0.72rem] font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1"
        >
          {loading ? (
            <span className="animate-spin">⏳ Sending AUSDC...</span>
          ) : (
            <>
              <span>💰</span> AUSDC Faucet (+10 AUSDC)
            </>
          )}
        </button>
        {txHash && (
          <a
            href={`https://testnet.monadscan.com/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-[0.68rem] font-mono text-emerald-600 underline font-bold"
          >
            Tx: {txHash.slice(0, 10)}... ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-2.5">
        <div>
          <span className="font-bold text-emerald-800 dark:text-emerald-300 block text-xs">
            💰 Cleanverse AUSDC Faucet
          </span>
          <span className="text-[0.68rem] text-[var(--muted-strong)]">
            Instant on-chain AUSDC payment to {walletLabel || "your CVI wallet"} (<code>{walletAddress ? `${walletAddress.slice(0, 8)}...` : ""}</code>)
          </span>
        </div>

        <button
          onClick={handleRequestFaucet}
          disabled={loading || !walletAddress}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          {loading ? (
            <><span className="animate-spin">⏳</span> Sending 10 AUSDC...</>
          ) : (
            <><span>💰</span> Request 10 AUSDC Faucet</>
          )}
        </button>
      </div>

      {txHash && (
        <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-emerald-700 dark:text-emerald-300">
            ✓ Successfully sent {successAmount} AUSDC to {walletAddress.slice(0, 8)}...
          </span>
          <a
            href={`https://testnet.monadscan.com/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-emerald-600 underline font-bold text-[0.72rem]"
          >
            View Tx: {txHash.slice(0, 14)}... (Monadscan) ↗
          </a>
        </div>
      )}

      {errorMsg && (
        <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-[0.68rem] font-semibold text-red-700 dark:text-red-300">
          ⚠️ AUSDC Faucet Error: {errorMsg}
        </div>
      )}
    </div>
  );
}
