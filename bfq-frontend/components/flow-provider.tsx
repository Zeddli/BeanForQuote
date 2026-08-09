"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  auditHistory,
  demoLots,
  demoParticipants,
  featuredLot,
  liveRfq,
  phaseNotes,
  settlementPreview,
} from "@/data/demo";
import type { CoffeeLot, DemoRfq, Participant, SettlementRecord } from "@/types/domain";

export type RoleStatus = "Inactive" | "Pending Approve" | "Active";

export type RoleRegistration = {
  walletAddress: string;
  role: "buyer" | "exporter";
  status: RoleStatus;
  requestedAt: number;
};

export type VerifiedLotRecord = {
  lotId: string;
  docHash: string;
  fileName: string;
  txHash: string;
  verifiedAt: number;
};

export type MintedLotRecord = {
  lotId: string;
  txHash: string;
  mintedAt: number;
};

type FlowContextValue = {
  participants: typeof demoParticipants;
  lots: CoffeeLot[];
  updateLotThresholds: (lotId: string, minPrice: number, maxPrice: number) => void;
  addLot: (lot: CoffeeLot) => void;
  auditHistory: typeof auditHistory;
  phaseNotes: typeof phaseNotes;
  activeParticipantId: string;
  activeParticipant: Participant;
  setActiveParticipantId: (participantId: string) => void;
  selectedLotId: string;
  selectedLot: CoffeeLot;
  setSelectedLotId: (lotId: string) => void;
  rfqState: DemoRfq;
  setRfqState: (rfq: DemoRfq) => void;
  selectedMaker: string | null;
  setSelectedMaker: (maker: string | null) => void;
  settlementState: SettlementRecord;
  setSettlementState: (settlement: SettlementRecord) => void;
  selectedTradeId: string;
  setSelectedTradeId: (tradeId: string) => void;
  selectedAuditRecord: SettlementRecord;
  // Role registration state
  roleRegistrations: Record<string, RoleRegistration>;
  registerRole: (walletAddress: string, role: "buyer" | "exporter") => void;
  approveRole: (walletAddress: string) => void;
  getRoleRegistration: (walletAddress: string) => RoleRegistration | null;
  // Asset verification state
  verifiedLots: Record<string, VerifiedLotRecord>;
  markLotAsVerified: (record: VerifiedLotRecord) => void;
  isLotVerified: (lotId: string) => boolean;
  // Asset tokenization state
  mintedLots: Record<string, MintedLotRecord>;
  mintLotToken: (lotId: string, txHash: string) => void;
  isLotMinted: (lotId: string) => boolean;
};

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [activeParticipantId, setActiveParticipantId] = useState("buyer-nordlicht");
  const [selectedLotId, setSelectedLotIdState] = useState(featuredLot.lotId);
  const [rfqState, setRfqStateState] = useState(liveRfq);
  const [selectedMaker, setSelectedMaker] = useState<string | null>(settlementPreview.selectedMaker);
  const [settlementState, setSettlementState] = useState(settlementPreview);
  const [selectedTradeId, setSelectedTradeId] = useState(settlementPreview.tradeId);

  // Dynamic Coffee Lots state with threshold support and localStorage persistence
  const [lots, setLots] = useState<CoffeeLot[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bfq_lots_data");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {}
    }
    return demoLots;
  });

  const saveLotsToStorage = (newLots: CoffeeLot[]) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("bfq_lots_data", JSON.stringify(newLots));
      } catch (e) {}
    }
  };

  const updateLotThresholds = useCallback((lotId: string, minPrice: number, maxPrice: number) => {
    setLots((prev) => {
      const next = prev.map((l) => (l.lotId === lotId ? { ...l, minPrice, maxPrice } : l));
      saveLotsToStorage(next);
      return next;
    });
  }, []);

  const addLot = useCallback((newLot: CoffeeLot) => {
    setLots((prev) => {
      if (prev.some((l) => l.lotId === newLot.lotId)) return prev;
      const next = [newLot, ...prev];
      saveLotsToStorage(next);
      return next;
    });
  }, []);

  // Role registrations — persisted to localStorage so refresh doesn't lose state
  const ROLE_STORAGE_KEY = "bfq_role_registrations";

  // Seed defaults for all demo participants (always Active on-chain)
  const defaultRoleRegistrations: Record<string, RoleRegistration> = {
    "0xd06178216134c059bf17c4d3dd60ccd36074edfd": {
      walletAddress: "0xD06178216134c059BF17c4D3dD60CCD36074edfd",
      role: "exporter", status: "Active", requestedAt: Date.now() - 86400000,
    },
    "0x9703f29ab27a1d72502cfedfdc739d26aa41abf88": {
      walletAddress: "0x9703f29Ab27a1D72502cfeDFc739d26aA41abF88",
      role: "buyer", status: "Active", requestedAt: Date.now() - 86400000,
    },
    // Also seed the alternate buyer address sometimes used in the demo
    "0x231f16a4226e14eee3bf91483c607008cad8fc6": {
      walletAddress: "0x231F16A4226e14EeeE3BF91483C607008Cad8FC6",
      role: "buyer", status: "Active", requestedAt: Date.now() - 86400000,
    },
  };

  const [roleRegistrations, setRoleRegistrations] = useState<Record<string, RoleRegistration>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(ROLE_STORAGE_KEY);
        if (saved) {
          // Merge: saved state wins for any address that was already registered;
          // defaults fill in any missing entries (e.g. first load after clearing storage)
          return { ...defaultRoleRegistrations, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error("Failed to load role registrations from localStorage:", e);
      }
    }
    return defaultRoleRegistrations;
  });

  const saveRoleRegistrations = (regs: Record<string, RoleRegistration>) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(regs));
      } catch (e) {}
    }
  };

  // Verified Asset Lots state with localStorage persistence
  const [verifiedLots, setVerifiedLots] = useState<Record<string, VerifiedLotRecord>>(() => {
    const initial: Record<string, VerifiedLotRecord> = {
      "LOT-ETH-042": {
        lotId: "LOT-ETH-042",
        docHash: "0x4a22804ec1726307693d2c9c092dbf7cc4342a9c060ee9215936008f787c4119",
        fileName: "ethiopia_yirgacheffe_bill_of_lading.pdf",
        txHash: "0x2c9265750d8847ff4a77fe31208abfdc3a",
        verifiedAt: Date.now() - 86400000,
      },
      "LOT-BR-019": {
        lotId: "LOT-BR-019",
        docHash: "0x8f2178216134c059bf17c4d3dd60ccd36074edfd",
        fileName: "brazil_cerrado_phytosanitary_cert.pdf",
        txHash: "0xed26a56ab4daf8f5a36a039e179ed4938fc976e8",
        verifiedAt: Date.now() - 43200000,
      },
      "LOT-CO-031": {
        lotId: "LOT-CO-031",
        docHash: "0x3f16a4226e14eee3bf91483c607008cad8fc6",
        fileName: "colombia_huila_certificate_of_origin.pdf",
        txHash: "0x4a56d24fbb25769f1c2e9aaef0d2d756a2a5fa6e",
        verifiedAt: Date.now() - 21600000,
      },
    };
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bfq_verified_lots");
        if (saved) {
          return { ...initial, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error("Failed to load verified lots:", e);
      }
    }
    return initial;
  });

  // Minted Lots state with localStorage persistence
  const [mintedLots, setMintedLots] = useState<Record<string, MintedLotRecord>>(() => {
    const initial: Record<string, MintedLotRecord> = {
      "LOT-ETH-042": {
        lotId: "LOT-ETH-042",
        txHash: "0x2c9265750d8847ff4a77fe31208abfdc3a",
        mintedAt: Date.now() - 86400000,
      },
    };
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bfq_minted_lots");
        if (saved) {
          return { ...initial, ...JSON.parse(saved) };
        }
      } catch (e) {
        console.error("Failed to load minted lots:", e);
      }
    }
    return initial;
  });

  const markLotAsVerified = useCallback((record: VerifiedLotRecord) => {
    setVerifiedLots((prev) => {
      const next = { ...prev, [record.lotId]: record };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("bfq_verified_lots", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  }, []);

  const isLotVerified = useCallback(
    (lotId: string) => Boolean(verifiedLots[lotId]),
    [verifiedLots]
  );

  const mintLotToken = useCallback((lotId: string, txHash: string) => {
    setMintedLots((prev) => {
      const next = { ...prev, [lotId]: { lotId, txHash, mintedAt: Date.now() } };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("bfq_minted_lots", JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  }, []);

  const isLotMinted = useCallback(
    (lotId: string) => Boolean(mintedLots[lotId]),
    [mintedLots]
  );

  // Cross-browser role synchronization function
  const fetchGlobalRegistrations = useCallback(async () => {
    try {
      const res = await fetch("/api/cleanverse/role-registration");
      if (res.ok) {
        const json = await res.json();
        if (json.registrations) {
          setRoleRegistrations((prev) => ({ ...prev, ...json.registrations }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch global role registrations:", e);
    }
  }, []);

  // Poll server every 3 seconds to keep multiple browser windows in sync
  useEffect(() => {
    fetchGlobalRegistrations();
    const interval = setInterval(fetchGlobalRegistrations, 3000);
    return () => clearInterval(interval);
  }, [fetchGlobalRegistrations]);

  const registerRole = useCallback(async (walletAddress: string, role: "buyer" | "exporter") => {
    if (!walletAddress) return;
    const lower = walletAddress.toLowerCase();

    setRoleRegistrations((prev) => {
      if (prev[lower]) return prev;
      const next = {
        ...prev,
        [lower]: {
          walletAddress,
          role,
          status: "Pending Approve" as const,
          requestedAt: Date.now(),
        },
      };
      saveRoleRegistrations(next);
      return next;
    });

    try {
      await fetch("/api/cleanverse/role-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, role, action: "register" }),
      });
      fetchGlobalRegistrations();
    } catch (e) {
      console.error("Failed to POST role registration:", e);
    }
  }, [fetchGlobalRegistrations]);

  const approveRole = useCallback(async (walletAddress: string) => {
    if (!walletAddress) return;
    const lower = walletAddress.toLowerCase();

    setRoleRegistrations((prev) => {
      const existing = prev[lower];
      const next = {
        ...prev,
        [lower]: {
          ...(existing ?? { walletAddress, role: "buyer" as const, requestedAt: Date.now() }),
          status: "Active" as const,
        },
      };
      saveRoleRegistrations(next);
      return next;
    });

    try {
      await fetch("/api/cleanverse/role-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, action: "approve" }),
      });
      fetchGlobalRegistrations();
    } catch (e) {
      console.error("Failed to POST role approval:", e);
    }
  }, [fetchGlobalRegistrations]);

  const getRoleRegistration = useCallback(
    (walletAddress: string): RoleRegistration | null => {
      if (!walletAddress) return null;
      return roleRegistrations[walletAddress.toLowerCase()] || null;
    },
    [roleRegistrations],
  );

  const activeParticipant = useMemo(() => {
    return demoParticipants.find((participant) => participant.id === activeParticipantId) ?? demoParticipants[0];
  }, [activeParticipantId]);

  const selectedLot = useMemo(() => {
    return lots.find((lot) => lot.lotId === selectedLotId) ?? lots[0] ?? featuredLot;
  }, [lots, selectedLotId]);

  const selectedAuditRecord = useMemo(() => {
    return auditHistory.find((record) => record.tradeId === selectedTradeId) ?? settlementState;
  }, [selectedTradeId, settlementState]);

  const setSelectedLotId = useCallback(
    (lotId: string) => {
      setSelectedLotIdState(lotId);
    },
    [setSelectedLotIdState],
  );

  const setRfqState = useCallback(
    (rfq: DemoRfq) => {
      setRfqStateState(rfq);
    },
    [setRfqStateState],
  );

  const value = useMemo(
    () => ({
      participants: demoParticipants,
      lots,
      updateLotThresholds,
      addLot,
      auditHistory,
      phaseNotes,
      activeParticipantId,
      activeParticipant,
      setActiveParticipantId,
      selectedLotId,
      selectedLot,
      setSelectedLotId,
      rfqState,
      setRfqState,
      selectedMaker,
      setSelectedMaker,
      settlementState,
      setSettlementState,
      selectedTradeId,
      setSelectedTradeId,
      selectedAuditRecord,
      roleRegistrations,
      registerRole,
      approveRole,
      getRoleRegistration,
      verifiedLots,
      markLotAsVerified,
      isLotVerified,
      mintedLots,
      mintLotToken,
      isLotMinted,
    }),
    [
      activeParticipant,
      activeParticipantId,
      addLot,
      approveRole,
      getRoleRegistration,
      isLotMinted,
      isLotVerified,
      lots,
      markLotAsVerified,
      mintLotToken,
      mintedLots,
      registerRole,
      rfqState,
      roleRegistrations,
      selectedAuditRecord,
      selectedLot,
      selectedLotId,
      selectedMaker,
      selectedTradeId,
      setRfqState,
      setSelectedLotId,
      settlementState,
      updateLotThresholds,
      verifiedLots,
    ],
  );

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow() {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error("useFlow must be used within a FlowProvider");
  }
  return context;
}
