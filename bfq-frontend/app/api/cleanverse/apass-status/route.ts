import { NextRequest, NextResponse } from "next/server";
import { queryApass } from "@/lib/cleanverse/client";
import { normalizeApassStatus } from "@/lib/cleanverse/normalize";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { chain?: string; address?: string };

    if (!body.chain || !body.address) {
      return NextResponse.json(
        { error: "chain and address are required" },
        { status: 400 },
      );
    }

    try {
      const response = await queryApass({
        chain: body.chain,
        address: body.address,
      });

      return NextResponse.json({
        raw: response,
        normalized: normalizeApassStatus(response),
        data: response.data || response,
      });
    } catch (apiError: any) {
      // If address is not yet registered/certified on Cleanverse, return uncertified status cleanly instead of 500 error
      return NextResponse.json({
        raw: null,
        normalized: { status: "uncertified", active: false },
        data: { status: 0, message: "Uncertified address" },
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown Cleanverse error",
      },
      { status: 500 },
    );
  }
}
