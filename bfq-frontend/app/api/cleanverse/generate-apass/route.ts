import { NextRequest, NextResponse } from "next/server";
import { generateApass } from "@/lib/cleanverse/client";
import type { CleanverseGenerateApassRequest } from "@/lib/cleanverse/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const address = body.wallet?.address || body.walletAddress || body.address;
    const chain = body.wallet?.chain || body.chain || "monad";

    if (!address) {
      return NextResponse.json(
        { error: "wallet address is required" },
        { status: 400 },
      );
    }

    // customerId: ≥12 alphanumeric chars
    let customerId = body.customerId || `BFQMONAD${Date.now().toString().slice(-8)}`;
    customerId = customerId.replace(/[^A-Za-z0-9]/g, "");
    while (customerId.length < 12) {
      customerId += "0";
    }

    // Default expirationTime to 1 year from now (in seconds)
    const expirationTime =
      body.expirationTime ||
      Math.floor(Date.now() / 1000) + 365 * 86400;

    const payload: CleanverseGenerateApassRequest = {
      customerId,
      expirationTime,
      wallet: {
        address,
        chain,
      },
      subGroup: body.subGroup || "EX",
      subTier: body.subTier || 1,
      override: true,
      identityDataList: body.identityDataList || [
        {
          idType: "PASSPORT",
          fullName: `Institutional ${body.subGroup || "Trader"}`,
          issuingCountryISO2: "US",
        },
      ],
    };

    const response = await generateApass(payload);

    return NextResponse.json({ raw: response });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown Cleanverse error" },
      { status: 500 },
    );
  }
}
