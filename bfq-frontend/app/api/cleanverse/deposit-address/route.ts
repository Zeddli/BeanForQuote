import { NextRequest, NextResponse } from "next/server";
import { queryDepositAddress } from "@/lib/cleanverse/client";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { chain?: string; address?: string };

    if (!body.chain || !body.address) {
      return NextResponse.json(
        { error: "chain and address are required" },
        { status: 400 },
      );
    }

    const response = await queryDepositAddress({
      chain: body.chain || "monad",
      address: body.address,
    });

    return NextResponse.json({
      raw: response,
      depositAddress: response.data?.depositUSDCWallet || response.data?.depositUSDTWallet || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to query deposit address",
      },
      { status: 500 },
    );
  }
}
