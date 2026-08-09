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
]);

const MOCK_CVA_ABI = parseAbi([
  "function wrapAsset(bytes32 lotId, uint256 amount, bytes calldata metadata) external returns (uint256)",
]);

function stringToBytes32(str: string): `0x${string}` {
  return keccak256(stringToBytes(str));
}

const QUALITY_INSPECTOR_ROLE = keccak256(stringToBytes("QUALITY_INSPECTOR_ROLE"));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lotId, docHash, fileName, docType, exporterAddress } = body;

    const lotIdStr = lotId || "LOT-ETH-042";
    const lotIdBytes32 = stringToBytes32(lotIdStr);
    const calculatedDocHash = docHash || stringToBytes32(fileName || "ownership_document.pdf");

    const privateKey = (process.env.DEPLOYER_PRIVATE_KEY ||
      process.env.CLEANVERSE_VALIDATOR_OWNER_PRIVATE_KEY ||
      "0x6443b3aa83e58eb33725e9aa4793fb6f764fd4a5671a3689103b7d1d69e2de65") as `0x${string}`;

    const account = privateKeyToAccount(privateKey);

    const walletClient = createWalletClient({
      account,
      chain: monadChain,
      transport: http(MONAD_TESTNET_CONFIG.rpcUrl),
    });

    console.log(`[VerifyCVA] Broadcasting CVA document verification on Monad Testnet for Lot: ${lotIdStr} (${lotIdBytes32})...`);

    // 1. Ensure QUALITY_INSPECTOR_ROLE is set on CleanverseCVIAdapter
    let isAccountInspector = false;
    try {
      isAccountInspector = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.cleanverseCviAdapter as `0x${string}`,
        abi: CVI_ADAPTER_ABI,
        functionName: "hasRole",
        args: [account.address, QUALITY_INSPECTOR_ROLE],
      });
    } catch (e) {
      console.warn("[VerifyCVA] hasRole check failed:", e);
    }

    if (!isAccountInspector) {
      console.log(`[VerifyCVA] Granting QUALITY_INSPECTOR_ROLE on CVIAdapter to sender ${account.address}...`);
      const setRoleTx = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.cleanverseCviAdapter as `0x${string}`,
        abi: CVI_ADAPTER_ABI,
        functionName: "setRole",
        args: [account.address, QUALITY_INSPECTOR_ROLE, true],
      });
      await publicClient.waitForTransactionReceipt({ hash: setRoleTx });
    }

    // 2. Sign document attestation on AttestationRegistry (0xf76a2decdd3dca42c6f95d5c3148c6e2accd42c4)
    console.log(`[VerifyCVA] Signing document attestation on AttestationRegistry...`);
    const attestTx = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.attestationRegistry as `0x${string}`,
      abi: ATTESTATION_ABI,
      functionName: "signGradeAttestation",
      args: [
        lotIdBytes32,
        "CVA-VERIFIED-DOC",
        `Doc: ${fileName || "document.pdf"} | Type: ${docType || "bill_of_lading"} | Hash: ${calculatedDocHash}`,
      ],
    });

    console.log(`[VerifyCVA] Attestation Tx sent: ${attestTx}. Waiting for receipt...`);
    await publicClient.waitForTransactionReceipt({ hash: attestTx });

    // 3. Wrap CVA Asset on MockCleanverseCVA (0xcfb4dd97d787c8818247ff4a77fe31208abfdc3a)
    const metadataHex = stringToHex(JSON.stringify({
      docHash: calculatedDocHash,
      fileName: fileName || "document.pdf",
      docType: docType || "bill_of_lading",
      exporterAddress: exporterAddress || account.address,
      timestamp: new Date().toISOString(),
    }));

    console.log(`[VerifyCVA] Executing wrapAsset on MockCleanverseCVA...`);
    const wrapTx = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.mockCleanverseCva as `0x${string}`,
      abi: MOCK_CVA_ABI,
      functionName: "wrapAsset",
      args: [lotIdBytes32, BigInt(1000), metadataHex],
    });

    console.log(`[VerifyCVA] CVA Wrap transaction successfully broadcast to Monad Testnet: ${wrapTx}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: wrapTx });

    return NextResponse.json({
      success: true,
      lotId: lotIdStr,
      docHash: calculatedDocHash,
      txHash: receipt.transactionHash || wrapTx,
      blockNumber: receipt.blockNumber?.toString(),
      explorerUrl: `${MONAD_TESTNET_CONFIG.explorerUrl}/tx/${receipt.transactionHash || wrapTx}`,
    });
  } catch (err: any) {
    console.error("[VerifyCVA Error]:", err);
    return NextResponse.json(
      {
        error: err.message || "Failed to verify document on Monad Testnet",
        details: err.shortMessage || err.cause?.message || String(err),
      },
      { status: 500 }
    );
  }
}
