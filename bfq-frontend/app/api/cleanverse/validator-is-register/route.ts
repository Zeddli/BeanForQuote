import { NextRequest, NextResponse } from "next/server";
import { validatorIsRegister } from "@/lib/cleanverse/client";

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

    const response = await validatorIsRegister({
      chain: body.chain,
      contract_address: body.contract_address,
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
