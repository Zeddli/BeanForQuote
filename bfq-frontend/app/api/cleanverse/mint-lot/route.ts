import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseAbi, keccak256, stringToBytes, stringToHex, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, MONAD_TESTNET_CONFIG } from "@/lib/contracts";

const monadChain = defineChain({
  id: MONAD_TESTNET_CONFIG.chainId,
  name: MONAD_TESTNET_CONFIG.chainName,
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [MONAD_TESTNET_CONFIG.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "Monadscan", url: MONAD_TESTNET_CONFIG.explorerUrl },
  },
});

const publicClient = createPublicClient({
  chain: monadChain,
  transport: http(MONAD_TESTNET_CONFIG.rpcUrl),
});

const CVI_ADAPTER_ABI = parseAbi([
  "function setRole(address wallet, bytes32 role, bool enabled) external",
  "function hasRole(address wallet, bytes32 role) external view returns (bool)",
]);

const ATTESTATION_ABI = parseAbi([
  "function signGradeAttestation(bytes32 lotId, string calldata grade, string calldata notes) external",
  "function getAttestation(bytes32 lotId) external view returns ((bytes32 attestationId, string grade, string notes, address inspector, uint256 timestamp))",
]);

const COFFEE_LOT_ABI = parseAbi([
  "function mintLot(bytes32 lotId, uint256 quantity, bytes calldata metadata) external",
  "function balances(bytes32 lotId, address owner) external view returns (uint256)",
  "error NotAuthorized()",
  "error MissingAttestation()",
  "error TransferNotAllowed()",
  "error InsufficientBalance()",
  "error SettlementEngineAlreadySet()",
]);

function stringToBytes32(str: string): `0x${string}` {
  return keccak256(stringToBytes(str));
}

const EXPORTER_ROLE = keccak256(stringToBytes("EXPORTER_ROLE"));
const QUALITY_INSPECTOR_ROLE = keccak256(stringToBytes("QUALITY_INSPECTOR_ROLE"));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lotRefId, quantityKg, origin, process: processMethod, ownerAddress } = body;

    const lotIdStr = lotRefId || `LOT-COL-${Math.floor(100 + Math.random() * 900)}`;
    const lotIdBytes32 = stringToBytes32(lotIdStr);
    const quantity = BigInt(quantityKg || 2400);

    const privateKey = (process.env.DEPLOYER_PRIVATE_KEY ||
      process.env.CLEANVERSE_VALIDATOR_OWNER_PRIVATE_KEY ||
      "0x6443b3aa83e58eb33725e9aa4793fb6f764fd4a5671a3689103b7d1d69e2de65") as `0x${string}`;

    const account = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
      account,
      chain: monadChain,
      transport: http(MONAD_TESTNET_CONFIG.rpcUrl),
    });

    console.log(`[MintLot] Preparing transaction on Monad Testnet for Lot: ${lotIdStr} (${lotIdBytes32}) by ${account.address}...`);

    // 1. Ensure transaction sender has EXPORTER_ROLE on CleanverseCVIAdapter (0x1c5fa313efc3868e0396532f92c163c02c148d6d)
    let isAccountExporter = false;
    try {
      isAccountExporter = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.cleanverseCviAdapter as `0x${string}`,
        abi: CVI_ADAPTER_ABI,
        functionName: "hasRole",
        args: [account.address, EXPORTER_ROLE],
      });
    } catch (e) {
      console.warn("[MintLot] hasRole check for EXPORTER_ROLE failed:", e);
    }

    if (!isAccountExporter) {
      console.log(`[MintLot] Granting EXPORTER_ROLE on CVIAdapter to sender ${account.address}...`);
      const setRoleTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.cleanverseCviAdapter as `0x${string}`,
        abi: CVI_ADAPTER_ABI,
        functionName: "setRole",
        args: [account.address, EXPORTER_ROLE, true],
      });
      await publicClient.waitForTransactionReceipt({ hash: setRoleTx });
    }

    // 2. Ensure transaction sender has QUALITY_INSPECTOR_ROLE on CleanverseCVIAdapter
    let isAccountInspector = false;
    try {
      isAccountInspector = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.cleanverseCviAdapter as `0x${string}`,
        abi: CVI_ADAPTER_ABI,
        functionName: "hasRole",
        args: [account.address, QUALITY_INSPECTOR_ROLE],
      });
    } catch (e) {
      console.warn("[MintLot] hasRole check for QUALITY_INSPECTOR_ROLE failed:", e);
    }

    if (!isAccountInspector) {
      console.log(`[MintLot] Granting QUALITY_INSPECTOR_ROLE on CVIAdapter to sender ${account.address}...`);
      const setRoleTx2 = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.cleanverseCviAdapter as `0x${string}`,
        abi: CVI_ADAPTER_ABI,
        functionName: "setRole",
        args: [account.address, QUALITY_INSPECTOR_ROLE, true],
      });
      await publicClient.waitForTransactionReceipt({ hash: setRoleTx2 });
    }

    // Grant EXPORTER_ROLE to ownerAddress if provided and different
    if (ownerAddress && ownerAddress.length >= 10 && ownerAddress.toLowerCase() !== account.address.toLowerCase()) {
      try {
        const isOwnerExporter = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.cleanverseCviAdapter as `0x${string}`,
          abi: CVI_ADAPTER_ABI,
          functionName: "hasRole",
          args: [ownerAddress as `0x${string}`, EXPORTER_ROLE],
        });
        if (!isOwnerExporter) {
          console.log(`[MintLot] Granting EXPORTER_ROLE on CVIAdapter to applicant ${ownerAddress}...`);
          const setRoleTx3 = await walletClient.writeContract({
            address: CONTRACT_ADDRESSES.cleanverseCviAdapter as `0x${string}`,
            abi: CVI_ADAPTER_ABI,
            functionName: "setRole",
            args: [ownerAddress as `0x${string}`, EXPORTER_ROLE, true],
          });
          await publicClient.waitForTransactionReceipt({ hash: setRoleTx3 });
        }
      } catch (e) {
        console.warn("[MintLot] Granting EXPORTER_ROLE to ownerAddress failed:", e);
      }
    }

    // 3. Check if Attestation exists on AttestationRegistry (0xf76a2decdd3dca42c6f95d5c3148c6e2accd42c4)
    let attestationExists = false;
    try {
      const att = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.attestationRegistry as `0x${string}`,
        abi: ATTESTATION_ABI,
        functionName: "getAttestation",
        args: [lotIdBytes32],
      });
      if (att && (att as any).attestationId && (att as any).attestationId !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        attestationExists = true;
      }
    } catch (e) {
      console.warn("[MintLot] getAttestation failed or not found, will sign new attestation:", e);
    }

    // 4. Sign grade attestation on-chain if missing
    if (!attestationExists) {
      console.log(`[MintLot] Signing grade attestation on AttestationRegistry for lot ${lotIdStr}...`);
      const attestTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.attestationRegistry as `0x${string}`,
        abi: ATTESTATION_ABI,
        functionName: "signGradeAttestation",
        args: [lotIdBytes32, "88.5", `Q-Grade 88.5 Certified - ${origin || "Colombia"} ${processMethod || "Washed"}`],
      });
      console.log(`[MintLot] Attestation Tx sent: ${attestTx}. Waiting for receipt...`);
      await publicClient.waitForTransactionReceipt({ hash: attestTx });
    }

    // 5. Execute mintLot on CoffeeLotToken (0xab06536d0f182db3c54f6e1d7503d5ddd489dc84)
    const metadataHex = stringToHex(JSON.stringify({
      lotId: lotIdStr,
      origin: origin || "Colombia",
      process: processMethod || "Washed",
      harvest: "2026",
    }));

    console.log(`[MintLot] Executing mintLot on CoffeeLotToken contract (${CONTRACT_ADDRESSES.coffeeLotToken})...`);
    const mintTx = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.coffeeLotToken as `0x${string}`,
      abi: COFFEE_LOT_ABI,
      functionName: "mintLot",
      args: [lotIdBytes32, quantity, metadataHex],
    });

    console.log(`[MintLot] Mint transaction successfully broadcast to Monad Testnet: ${mintTx}`);

    // Wait for mining to ensure receipt is live on Monadscan
    const receipt = await publicClient.waitForTransactionReceipt({ hash: mintTx });

    return NextResponse.json({
      success: true,
      lotId: lotIdStr,
      lotIdBytes32,
      txHash: receipt.transactionHash || mintTx,
      blockNumber: receipt.blockNumber?.toString(),
      explorerUrl: `${MONAD_TESTNET_CONFIG.explorerUrl}/tx/${receipt.transactionHash || mintTx}`,
    });
  } catch (err: any) {
    console.error("[MintLot Error]:", err);
    return NextResponse.json(
      {
        error: err.message || "Failed to mint lot on Monad Testnet",
        details: err.shortMessage || err.cause?.message || String(err),
      },
      { status: 500 }
    );
  }
}
