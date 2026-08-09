import { NextRequest, NextResponse } from "next/server";
import { getCleanverseConfig } from "@/lib/cleanverse/config";
import { signValidatorOwnerMessage } from "@/lib/cleanverse/validator-signature";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      chain?: string;
      contract_address?: string;
    };

    if (!body.chain || !body.contract_address) {
      return NextResponse.json(
        { error: "chain and contract_address are required" },
        { status: 400 },
      );
    }

    const config = getCleanverseConfig();

    if (!config.validatorOwnerPrivateKey) {
      return NextResponse.json(
        { error: "CLEANVERSE_VALIDATOR_OWNER_PRIVATE_KEY is not configured" },
        { status: 500 },
      );
    }

    const signed = await signValidatorOwnerMessage(
      body.chain,
      body.contract_address,
      config.validatorOwnerPrivateKey,
    );

    return NextResponse.json({
      chain: body.chain,
      contract_address: body.contract_address,
      signer: signed.signer,
      message: signed.message,
      messageHash: signed.messageHash,
      owner_signature: signed.signature,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown signature error",
      },
      { status: 500 },
    );
  }
}
