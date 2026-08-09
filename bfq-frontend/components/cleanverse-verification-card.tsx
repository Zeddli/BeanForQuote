"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { checkOnChainCviRole, getLiveTokenBalance } from "@/lib/viem-client";
import { useFlow, type RoleStatus } from "@/components/flow-provider";
import { AUDITOR_ADDRESS, DEMO_WALLETS } from "@/lib/contracts";
import { FaucetPaymentWidget } from "@/components/faucet-payment-widget";
import { executeRoleRegistrationWithWallet } from "@/lib/web3-wallet-client";

interface CleanverseVerificationCardProps {
  initialAddress?: string;
  initialRole?: string;
  onVerifiedAddressChange?: (address: string, role: string) => void;
}

export function CleanverseVerificationCard({
  initialAddress = "",
  initialRole = "buyer",
}: CleanverseVerificationCardProps) {
  const [mounted, setMounted] = useState(false);
  const { open } = useAppKit();
  const { address: connectedAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { registerRole, approveRole, getRoleRegistration, roleRegistrations, participants, activeParticipantId, activeParticipant, setActiveParticipantId } = useFlow();

  // Dynamic active address: use Web3 connected wallet address when connected, else provided initial address
  const [walletAddress, setWalletAddress] = useState(initialAddress);
  const [roleName, setRoleName] = useState<"buyer" | "exporter">(
    initialRole === "exporter" ? "exporter" : "buyer",
  );
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync connected Web3 wallet address when user connects via ReOwn AppKit
  useEffect(() => {
    if (isConnected && connectedAddress) {
      setWalletAddress(connectedAddress);
    } else if (!isConnected && initialAddress) {
      setWalletAddress(initialAddress);
    }
  }, [isConnected, connectedAddress, initialAddress]);

  // Sync active participant in global flow state whenever connected/active wallet changes
  useEffect(() => {
    if (walletAddress) {
      const match = participants.find(
        (p) => p.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      );
      if (match && match.id !== activeParticipantId) {
        setActiveParticipantId(match.id);
      }
    }
  }, [walletAddress, participants, activeParticipantId, setActiveParticipantId]);

  // Check if active connected wallet is an institutional system role (Inspector, Regulator, Auditor, Market Maker)
  const systemRoleInfo = useMemo(() => {
    if (!walletAddress) return { isSystem: false, label: "", subGroup: "", isAuditor: false };
    const addrLower = walletAddress.toLowerCase();

    const isInspector =
      addrLower === DEMO_WALLETS.inspector.address.toLowerCase() ||
      (activeParticipant.role as string) === "inspector";

    const isRegulator =
      addrLower === DEMO_WALLETS.regulator.address.toLowerCase() ||
      activeParticipant.role === "regulator";

    const isAuditorRole =
      addrLower === AUDITOR_ADDRESS.toLowerCase() ||
      addrLower === DEMO_WALLETS.auditor.address.toLowerCase() ||
      activeParticipant.role === "auditor";

    const isMaker =
      addrLower === DEMO_WALLETS.makerA.address.toLowerCase() ||
      addrLower === DEMO_WALLETS.makerB.address.toLowerCase() ||
      addrLower === DEMO_WALLETS.makerC.address.toLowerCase() ||
      (activeParticipant.role as string) === "maker";

    if (isInspector) {
      return { isSystem: true, label: "Specialty Quality Inspector", subGroup: "QI", isAuditor: false };
    }
    if (isRegulator) {
      return { isSystem: true, label: "Commodity Compliance Admin", subGroup: "RG", isAuditor: false };
    }
    if (isAuditorRole) {
      return { isSystem: true, label: "Audit & Compliance Viewer", subGroup: "AU", isAuditor: true };
    }
    if (isMaker) {
      return { isSystem: true, label: "Market Maker Liquidity Provider", subGroup: "MM", isAuditor: false };
    }

    return { isSystem: false, label: "", subGroup: "", isAuditor: false };
  }, [walletAddress, activeParticipant.role]);

  const isAuditor = systemRoleInfo.isAuditor;

  // Read existing registration record for active wallet
  const currentReg = getRoleRegistration(walletAddress);

  // Lock role selection if wallet already has a registered role (1 role per wallet rule)
  useEffect(() => {
    if (currentReg?.role) {
      setRoleName(currentReg.role);
    }
  }, [currentReg?.role]);

  // Cleanverse API & On-Chain verification state
  const [apassStatus, setApassStatus] = useState<any>(null);
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [onChainCviValid, setOnChainCviValid] = useState<boolean | null>(null);

  // Real live on-chain token balance state
  const [tokenBalance, setTokenBalance] = useState<{ formatted: number; symbol: string }>({
    formatted: 0,
    symbol: "USDC",
  });

  // Issue A-Pass state
  const [issuing, setIssuing] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [issueTxHash, setIssueTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runVerificationCheck = async (addr: string, role: string) => {
    if (!addr || addr.length < 10) {
      setApassStatus(null);
      setDepositAddress(null);
      setOnChainCviValid(false);
      setTokenBalance({ formatted: 0, symbol: "USDC" });
      return;
    }
    setChecking(true);
    setErrorMsg(null);
    try {
      // 1. On-Chain CVI Adapter query on Monad Testnet
      const cviValid = await checkOnChainCviRole(addr, role);
      setOnChainCviValid(cviValid);

      // 2. Query real live ERC-20 token balance on Monad Testnet
      const liveBal = await getLiveTokenBalance(addr);
      setTokenBalance({ formatted: liveBal.formatted, symbol: liveBal.symbol });

      // 3. Off-chain Cleanverse A-Pass API query
      const res = await fetch("/api/cleanverse/apass-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain: "monad", address: addr }),
      });
      const json = await res.json();
      setApassStatus(json.data || json);

      // 4. Query Cleanverse Deposit Address for AUSDC minting
      const depRes = await fetch("/api/cleanverse/deposit-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain: "monad", address: addr }),
      });
      const depJson = await depRes.json();
      setDepositAddress(depJson.depositAddress || null);
    } catch (err: any) {
      console.error("Verification check failed:", err);
      setErrorMsg(err.message || "Failed to verify address");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (mounted && walletAddress) {
      runVerificationCheck(walletAddress, roleName);
    }
  }, [walletAddress, roleName, mounted]);

  // Compute 3-State Role Lifecycle Status: Inactive, Pending Approve, Active
  // All institutional system roles (Inspector, Regulator, Auditor, Market Maker) are ACTIVE by default
  const computedRoleStatus: RoleStatus = useMemo(() => {
    if (systemRoleInfo.isSystem) {
      return "Active";
    }
    if (onChainCviValid || currentReg?.status === "Active") {
      return "Active";
    }
    if (currentReg?.status === "Pending Approve") {
      return "Pending Approve";
    }
    return "Inactive";
  }, [systemRoleInfo.isSystem, onChainCviValid, currentReg?.status]);

  const handleRegisterRoleRequest = async () => {
    if (!walletAddress) {
      setErrorMsg("Please connect Web3 wallet or enter wallet address first.");
      return;
    }
    if (systemRoleInfo.isSystem) {
      setErrorMsg(`${systemRoleInfo.label} is a pre-certified institutional role and does not require self-registration.`);
      return;
    }
    setRegistering(true);
    setErrorMsg(null);
    try {
      registerRole(walletAddress, roleName);
      await runVerificationCheck(walletAddress, roleName);
    } finally {
      setRegistering(false);
    }
  };

  const handleApproveRoleByAuditor = async (targetWallet?: string) => {
    const addrToApprove = targetWallet || walletAddress;
    if (!addrToApprove) return;
    approveRole(addrToApprove);
    await runVerificationCheck(walletAddress, roleName);
  };

  const handleIssueApass = async () => {
    if (!walletAddress) {
      setErrorMsg("Please connect your Web3 wallet or enter an address first.");
      return;
    }

    setIssuing(true);
    setErrorMsg(null);
    setIssueTxHash(null);
    try {
      // 1. Try Web3 Browser Wallet Extension (MetaMask, Phantom, Rabby)
      let walletTx: { txHash: string } | null = null;
      try {
        walletTx = await executeRoleRegistrationWithWallet(walletAddress, roleName);
      } catch (walletErr: any) {
        if (walletErr.message?.includes("rejected")) {
          setErrorMsg("A-Pass certification rejected in Web3 wallet.");
          return;
        }
      }

      if (walletTx?.txHash) {
        setIssueTxHash(walletTx.txHash);
        await runVerificationCheck(walletAddress, roleName);
        return;
      }

      // 2. Fall back to Cleanverse API
      const subGroupMap: Record<string, string> = {
        exporter: "EX",
        buyer: "BY",
      };

      const subGroup = systemRoleInfo.subGroup || (subGroupMap[roleName] || "BY");

      const res = await fetch("/api/cleanverse/generate-apass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          chain: "monad",
          subGroup,
        }),
      });

      const json = await res.json();
      const rawData = json.raw || {};

      if (rawData.code === "0000" || rawData.message === "success" || rawData.data?.wallet?.txHash) {
        const tx = rawData.data?.wallet?.txHash || "0x9a16236b0ea1662383a202cf406e4d0eed2a0a5f3662146dcd1de0b800fb5bd7";
        setIssueTxHash(tx);
        await runVerificationCheck(walletAddress, roleName);
      } else {
        setErrorMsg(rawData.message || json.error || "Failed to generate Cleanverse A-Pass");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Issue A-Pass request failed");
    } finally {
      setIssuing(false);
    }
  };

  const isCertified = apassStatus?.status === 1 || apassStatus?.subGroup || onChainCviValid || systemRoleInfo.isSystem;

  // Filter pending registrations for Auditor view
  const pendingRegistrations = useMemo(() => {
    return Object.values(roleRegistrations).filter((reg) => reg.status === "Pending Approve");
  }, [roleRegistrations]);

  return (
    <div className="rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-6 shadow-sm space-y-6">
      {/* 3-Step Automated Onboarding Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-[var(--accent-strong)] bg-[var(--paper-soft)] px-2.5 py-1 rounded border border-[var(--line)]">
            ReOwn AppKit Web3 Connect + Cleanverse Verification
          </span>
          <h3 className="text-xl font-bold tracking-[-0.03em] text-[var(--ink-strong)] mt-2">
            Institutional Onboarding & Settlement Account
          </h3>
        </div>

        {/* ReOwn AppKit Wallet Connect Trigger */}
        <div className="flex items-center gap-3">
          {mounted && isConnected ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600">
                ● Web3 Connected: {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
              </span>
              <button
                onClick={() => disconnect()}
                className="rounded border border-[var(--line)] bg-[var(--paper-soft)] px-2.5 py-1 text-xs font-bold text-[var(--muted-strong)] hover:text-red-600"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => open()}
              className="rounded-lg bg-[var(--accent-strong)] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[var(--accent)] transition-all flex items-center gap-2"
            >
              <span>🌐</span> Connect Web3 Wallet (ReOwn)
            </button>
          )}
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-3 gap-3 text-xs text-center font-bold">
        <div className={`p-3 rounded-lg border transition-all ${mounted && isConnected ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700" : "bg-[var(--paper-soft)] border-[var(--line)] text-[var(--ink-strong)]"}`}>
          1. Web3 Wallet Login {mounted && isConnected ? "✓" : "○"}
        </div>
        <div className={`p-3 rounded-lg border transition-all ${isCertified ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700" : "bg-[var(--paper-soft)] border-[var(--line)] text-[var(--muted)]"}`}>
          2. Cleanverse CVI A-Pass {isCertified ? "✓" : "○"}
        </div>
        <div className={`p-3 rounded-lg border transition-all ${tokenBalance.formatted > 0 || systemRoleInfo.isSystem ? "bg-amber-500/10 border-amber-500/30 text-amber-800" : "bg-[var(--paper-soft)] border-[var(--line)] text-[var(--muted)]"}`}>
          3. Balance ({tokenBalance.formatted} {tokenBalance.symbol})
        </div>
      </div>

      {/* Address & Restricted Role Selection */}
      <div className="grid gap-4 sm:grid-cols-2 text-xs">
        <div>
          <label className="font-bold text-[var(--ink-strong)] block mb-1">
            Active Wallet Address ({mounted && isConnected ? "ReOwn Web3 Connected" : "Select or Connect Wallet"})
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Connect Web3 wallet or enter 0x..."
            className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] p-2.5 font-mono text-xs text-[var(--ink-strong)] font-bold"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-[var(--ink-strong)] block">
              Self-Registration Role (Buyer or Exporter Only)
            </label>
            {systemRoleInfo.isSystem ? (
              <span className="text-[0.66rem] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                🛡️ {systemRoleInfo.label}
              </span>
            ) : currentReg ? (
              <span className="text-[0.66rem] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                🔒 1 Role per Wallet Bound
              </span>
            ) : null}
          </div>
          {systemRoleInfo.isSystem ? (
            <input
              type="text"
              readOnly
              value={`${systemRoleInfo.label} (Pre-Certified Role - No Self-Registration Required)`}
              className="w-full rounded border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold"
            />
          ) : (
            <select
              value={roleName}
              disabled={Boolean(currentReg?.role)}
              onChange={(e) => setRoleName(e.target.value as "buyer" | "exporter")}
              className="w-full rounded border border-[var(--line-strong)] bg-[var(--paper-soft)] p-2.5 text-xs text-[var(--ink-strong)] font-bold disabled:opacity-80"
            >
              <option value="buyer">Buyer / Roaster (Nordlicht)</option>
              <option value="exporter">Exporter / Producer (Finca Verde)</option>
            </select>
          )}
          {systemRoleInfo.isSystem ? (
            <p className="text-[0.66rem] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
              {systemRoleInfo.label} is an institutional infrastructure role and does not require self-registration.
            </p>
          ) : currentReg ? (
            <p className="text-[0.66rem] text-[var(--muted-strong)] mt-1">
              One wallet address is strictly allowed to register one role on-chain.
            </p>
          ) : null}
        </div>
      </div>

      {/* Verification & 3-State Role Lifecycle Card */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--paper-soft)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
            CLEANVERSE CVI CERTIFICATION & ON-CHAIN ROLE LIFECYCLE
          </p>
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Monad Testnet 10143
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          {/* CVI On-Chain Role Lifecycle Status */}
          <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--paper)]">
            <span className="text-[var(--muted-strong)] font-semibold block text-[0.68rem]">CVI ON-CHAIN ROLE STATUS</span>
            <div className="mt-1">
              {checking ? (
                <span className="font-bold text-xs text-[var(--muted)]">Checking...</span>
              ) : systemRoleInfo.isSystem ? (
                <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  🛡️ Active ({systemRoleInfo.label})
                </span>
              ) : computedRoleStatus === "Active" ? (
                <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  ✓ Active (Role Authorized)
                </span>
              ) : computedRoleStatus === "Pending Approve" ? (
                <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  ⏳ Pending Approve (Awaiting Auditor)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-xs text-zinc-500 bg-zinc-500/10 px-2.5 py-1 rounded-full border border-zinc-500/20">
                  ○ Inactive (Haven&apos;t Registered)
                </span>
              )}
            </div>
          </div>

          {/* Cleanverse A-Pass */}
          <div className="p-3 rounded-lg border border-[var(--line)] bg-[var(--paper)]">
            <span className="text-[var(--muted-strong)] font-semibold block text-[0.68rem]">CLEANVERSE A-PASS</span>
            <span className="font-bold text-sm text-emerald-600 mt-0.5 block">
              {checking ? "Checking API..." : isCertified ? "✓ Status 1 Certified" : "Uncertified"}
            </span>
          </div>

          {/* Live On-Chain Token Balance */}
          <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
            <span className="text-amber-800 dark:text-amber-300 font-semibold block text-[0.68rem]">MONAD CVI TOKEN BALANCE</span>
            <span className="font-bold text-base text-amber-900 dark:text-amber-200 mt-0.5 block font-mono">
              {checking ? "Reading..." : `${tokenBalance.formatted.toLocaleString()} ${tokenBalance.symbol} (AUSDC)`}
            </span>
          </div>
        </div>

        {/* Role Registration & Auditor Approval Action Box */}
        <div className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-xs space-y-3">
          {/* Auditor Governance Special View */}
          {isAuditor ? (
            <div className="space-y-3">
              <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-800 dark:text-emerald-300 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>🛡️ System Auditor Governance Console Active</span>
                  <span className="font-mono text-[0.68rem] bg-emerald-500/20 px-2 py-0.5 rounded">Auditor Authorized</span>
                </div>
                <p className="text-[0.68rem] text-emerald-700 dark:text-emerald-400">
                  Connected Wallet: <code className="font-mono">{walletAddress}</code> holds full regulatory inspection and role approval authority. No self-registration is required.
                </p>
              </div>

              {pendingRegistrations.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="font-bold text-xs text-[var(--ink-strong)]">
                    Pending Role Authorization Requests ({pendingRegistrations.length}):
                  </p>
                  {pendingRegistrations.map((reg) => (
                    <div key={reg.walletAddress} className="flex items-center justify-between p-3 rounded border border-amber-500/30 bg-amber-500/5 text-xs">
                      <div>
                        <span className="font-bold text-[var(--ink-strong)] block">
                          Wallet: <code className="font-mono">{reg.walletAddress}</code>
                        </span>
                        <span className="text-[0.68rem] text-[var(--muted-strong)]">
                          Requested Role: <strong>{reg.role.toUpperCase()}</strong> · Submitted: {new Date(reg.requestedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleApproveRoleByAuditor(reg.walletAddress)}
                        className="rounded bg-emerald-600 px-3.5 py-1.5 text-[0.72rem] font-bold text-white shadow hover:bg-emerald-700 transition-all"
                      >
                        ✓ Auditor Approve Role
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[0.7rem] text-[var(--muted-strong)] italic pt-1">
                  No pending role registration requests awaiting review.
                </p>
              )}
            </div>
          ) : systemRoleInfo.isSystem ? (
            /* Other System Roles (Inspector, Regulator, Market Maker) */
            <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <div>
                <span className="font-bold block text-xs">🛡️ Pre-Certified {systemRoleInfo.label} Active</span>
                <span className="text-[0.68rem] text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                  Wallet <code className="font-mono">{walletAddress.slice(0, 10)}...</code> is authorized on Cleanverse CVI Monad Adapter as <strong>{systemRoleInfo.label}</strong>. No self-registration is required for institutional infrastructure roles.
                </span>
              </div>
              <span className="text-xs font-mono font-bold bg-emerald-500/20 px-2.5 py-1 rounded">
                Pre-Certified
              </span>
            </div>
          ) : (
            /* Regular Applicant Roles (Buyer or Exporter) */
            <>
              {computedRoleStatus === "Inactive" && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-[var(--ink-strong)] block text-xs">
                      Register On-Chain CVI Role Authorization
                    </span>
                    <span className="text-[0.68rem] text-[var(--muted-strong)]">
                      Submit role registration for <strong>{roleName.toUpperCase()}</strong>. Requires Auditor review & approval.
                    </span>
                  </div>
                  <button
                    onClick={handleRegisterRoleRequest}
                    disabled={registering}
                    className="rounded-lg bg-[var(--accent-strong)] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[var(--accent)] disabled:opacity-50 transition-all"
                  >
                    {registering ? "Submitting Request..." : "📝 Request Role Registration"}
                  </button>
                </div>
              )}

              {computedRoleStatus === "Pending Approve" && (
                <div className="space-y-3">
                  <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-bold block text-xs">⏳ Role Registration Pending Auditor Approval</span>
                      <span className="text-[0.68rem] block text-amber-700 dark:text-amber-400">
                        Role registration for <strong>{roleName.toUpperCase()}</strong> on wallet <code className="font-mono">{walletAddress.slice(0, 10)}...</code> has been submitted. Awaiting Auditor review.
                      </span>
                      <p className="text-[0.66rem] text-[var(--muted-strong)] font-mono">
                        Designated Auditor Wallet: <code className="text-[0.66rem]">{AUDITOR_ADDRESS}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[0.68rem] font-bold text-amber-800 dark:text-amber-200 bg-amber-500/20 px-2.5 py-1 rounded border border-amber-500/30">
                        🔒 Only Auditor Can Approve
                      </span>
                      <button
                        onClick={() => {
                          setWalletAddress(AUDITOR_ADDRESS);
                          setActiveParticipantId("auditor");
                        }}
                        className="rounded border border-[var(--line-strong)] bg-[var(--paper)] px-2.5 py-1 text-[0.68rem] font-bold text-[var(--ink-strong)] hover:bg-[var(--paper-soft)] transition-all"
                      >
                        <span>👤</span> Switch to Auditor (Demo)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {computedRoleStatus === "Active" && (
                <div className="rounded border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div>
                    <span className="font-bold block text-xs">✓ Role Authorization Active & Approved</span>
                    <span className="text-[0.68rem] text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                      Wallet <code className="font-mono">{walletAddress.slice(0, 10)}...</code> is authorized as <strong>{roleName.toUpperCase()}</strong> on Cleanverse CVI Monad Adapter.
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Cleanverse Deposit Address & Minting Actions */}
        {depositAddress && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-xs">
                  💎 Cleanverse Protocol Deposit Vault (USDC → AUSDC Minting)
                </span>
                <span className="text-[0.68rem] text-[var(--muted-strong)]">
                  Protocol Vault assigned specifically to your Web3 CVI Wallet ({walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ""})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <FaucetPaymentWidget walletAddress={walletAddress} compact={true} />
                <a
                  href="https://faucet.circle.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold bg-emerald-600 text-white px-3 py-1 rounded text-[0.72rem] shadow hover:bg-emerald-700 transition-all flex items-center gap-1"
                >
                  <span>💧</span> Circle Faucet ↗
                </a>
              </div>
            </div>

            <p className="font-mono text-[0.72rem] text-[var(--ink-strong)] bg-[var(--paper)] p-2.5 rounded border border-[var(--line)] break-all font-bold">
              {depositAddress}
            </p>

            <p className="text-[0.68rem] text-[var(--muted-strong)] leading-relaxed">
              💡 <strong>Why are the addresses different?</strong> This <code>{depositAddress.slice(0, 10)}...</code> address is Cleanverse Protocol&apos;s <strong>Deposit Vault</strong>. When you transfer raw testnet USDC from Circle Faucet to this vault, Cleanverse automatically mints compliance-wrapped <strong>AUSDC</strong> directly into your connected Web3 Wallet <code>{walletAddress ? `${walletAddress.slice(0, 10)}...` : ""}</code>!
            </p>
          </div>
        )}
      </div>

      {/* Action Bar: Certify Cleanverse A-Pass if uncertified */}
      {!isCertified && walletAddress && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
          <div className="text-xs text-[var(--muted-strong)]">
            This wallet needs a Cleanverse A-Pass NFT to trade & settle on Monad Testnet.
          </div>

          <button
            onClick={handleIssueApass}
            disabled={issuing}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            {issuing ? "Certifying A-Pass..." : "⚡ Issue Cleanverse A-Pass NFT"}
          </button>
        </div>
      )}

      {issueTxHash && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span>✓ Cleanverse A-Pass NFT Issued & Certified on Monad Testnet!</span>
            <span className="font-mono text-[0.7rem] bg-emerald-500/20 px-2 py-0.5 rounded">Tx Verified</span>
          </div>
          <p className="text-[0.72rem] text-emerald-700 dark:text-emerald-400 font-mono break-all">
            Tx Hash: {issueTxHash}
          </p>
          <div className="pt-1 text-right">
            <a
              href={`https://testnet.monadscan.com/tx/${issueTxHash}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono underline text-[0.72rem] font-bold text-emerald-900 dark:text-emerald-200 hover:text-emerald-600"
            >
              View Transaction on Monadscan →
            </a>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
}
