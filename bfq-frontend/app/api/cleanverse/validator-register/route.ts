import { NextRequest, NextResponse } from "next/server";
import { validatorIsRegister, validatorRegister } from "@/lib/cleanverse/client";
import type { ValidatorRegisterRequest } from "@/lib/cleanverse/validator-types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ValidatorRegisterRequest>;

    if (!body.chain || !body.contract_address || !body.owner_signature || !body.rule) {
      return NextResponse.json(
        {
          error:
            "chain, contract_address, owner_signature, and rule are required",
        },
        { status: 400 },
      );
    }

    // Guard: registering an already-registered pool causes on-chain revert (12026).
    const alreadyRegistered = await validatorIsRegister({
      chain: body.chain,
      contract_address: body.contract_address,
    });
    if (alreadyRegistered.data?.registered) {
      return NextResponse.json({
        raw: alreadyRegistered,
        alreadyRegistered: true,
        message: "Pool is already registered — no action taken.",
      });
    }

    const response = await validatorRegister({
      chain: body.chain,
      contract_address: body.contract_address,
      owner_signature: body.owner_signature,
      rule: body.rule,
    });

    return NextResponse.json({ raw: response });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown Cleanverse error",
      },
      { status: 500 },
    );
  }
}

