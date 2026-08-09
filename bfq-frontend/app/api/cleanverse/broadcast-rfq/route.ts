import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  keccak256,
  stringToBytes,
  stringToHex,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, MONAD_TESTNET_CONFIG } from "@/lib/contracts";

const monadChain = defineChain({
  id: MONAD_TESTNET_CONFIG.chainId,
  name: MONAD_TESTNET_CONFIG.chainName,
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [MONAD_TESTNET_CONFIG.rpcUrl] } },
  blockExplorers: { default: { name: "Monadscan", url: MONAD_TESTNET_CONFIG.explorerUrl } },
});

const publicClient = createPublicClient({
  chain: monadChain,
  transport: http(MONAD_TESTNET_CONFIG.rpcUrl),
});

// Use the AttestationRegistry to record RFQ broadcast on-chain.
// signGradeAttestation is the available write function on the deployed contract.
const ATTESTATION_ABI = parseAbi([
  "function signGradeAttestation(bytes32 lotId, string calldata grade, string calldata notes) external",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rfqId, lotId, buyerAddress, quantityKg, destination, minPrice, maxPrice } = body;

    if (!lotId) {
      return NextResponse.json({ error: "lotId is required" }, { status: 400 });
    }

    const privateKey = (
      process.env.DEPLOYER_PRIVATE_KEY ||
      process.env.CLEANVERSE_VALIDATOR_OWNER_PRIVATE_KEY ||
      "0x6443b3aa83e58eb33725e9aa4793fb6f764fd4a5671a3689103b7d1d69e2de65"
    ) as `0x${string}`;

    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
      account,
      chain: monadChain,
      transport: http(MONAD_TESTNET_CONFIG.rpcUrl),
    });

    // Derive lot bytes32 from lotId string
    const lotBytes32 = keccak256(stringToBytes(lotId));

    const rfqNotes = JSON.stringify({
      rfqId: rfqId || `RFQ-${Date.now()}`,
      buyer: buyerAddress,
      quantityKg,
      destination,
      minPrice,
      maxPrice,
      broadcastAt: new Date().toISOString(),
    });

    console.log(`[BroadcastRFQ] Writing RFQ attestation to Monad Testnet for Lot: ${lotId} (${lotBytes32})...`);

    const txHash = await walletClient.writeContract({
      address: CONTRACT_ADDRESSES.attestationRegistry as `0x${string}`,
      abi: ATTESTATION_ABI,
      functionName: "signGradeAttestation",
      args: [lotBytes32, "RFQ_BROADCAST", rfqNotes],
    });

    console.log(`[BroadcastRFQ] Tx broadcast: ${txHash}. Waiting for receipt...`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const finalHash = receipt.transactionHash || txHash;

    console.log(`[BroadcastRFQ] Confirmed on Monad Block ${receipt.blockNumber}: ${finalHash}`);

    return NextResponse.json({
      success: true,
      rfqId: rfqId || `RFQ-${Date.now()}`,
      txHash: finalHash,
      blockNumber: receipt.blockNumber?.toString(),
      explorerUrl: `${MONAD_TESTNET_CONFIG.explorerUrl}/tx/${finalHash}`,
    });
  } catch (err: any) {
    console.error("[BroadcastRFQ Error]:", err);
    return NextResponse.json(
      {
        error: err.message || "Failed to broadcast RFQ on Monad Testnet",
        details: err.shortMessage || err.cause?.message || String(err),
      },
      { status: 500 },
    );
  }
}
