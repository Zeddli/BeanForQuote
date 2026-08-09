import { NextRequest, NextResponse } from "next/server";
import { validatorVerify } from "@/lib/cleanverse/client";
import { normalizeValidatorVerify } from "@/lib/cleanverse/normalize";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      chain?: string;
      contract_address?: string;
      user_address?: string;
    };

    if (!body.chain || !body.contract_address || !body.user_address) {
      return NextResponse.json(
        { error: "chain, contract_address, and user_address are required" },
        { status: 400 },
      );
    }

    const response = await validatorVerify({
      chain: body.chain,
      contract_address: body.contract_address,
      user_address: body.user_address,
    });

    return NextResponse.json({
      raw: response,
      normalized: normalizeValidatorVerify(response),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown Cleanverse error",
      },
      { status: 500 },
    );
  }
}
