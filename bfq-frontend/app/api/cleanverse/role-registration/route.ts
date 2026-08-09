import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export type ServerRoleRegistration = {
  walletAddress: string;
  role: "buyer" | "exporter";
  status: "Inactive" | "Pending Approve" | "Active";
  requestedAt: number;
};

// File-backed persistence so server restarts don't lose state
const STORAGE_FILE = path.join(process.cwd(), ".role-registrations.json");

// Seed defaults — always Active for all demo participants
const DEFAULT_REGISTRATIONS: Record<string, ServerRoleRegistration> = {
  "0xd06178216134c059bf17c4d3dd60ccd36074edfd": {
    walletAddress: "0xD06178216134c059BF17c4D3dD60CCD36074edfd",
    role: "exporter",
    status: "Active",
    requestedAt: Date.now() - 86400000,
  },
  "0x9703f29ab27a1d72502cfedfdc739d26aa41abf88": {
    walletAddress: "0x9703f29Ab27a1D72502cfeDFc739d26aA41abF88",
    role: "buyer",
    status: "Active",
    requestedAt: Date.now() - 86400000,
  },
  "0x231f16a4226e14eee3bf91483c607008cad8fc6": {
    walletAddress: "0x231F16A4226e14EeeE3BF91483C607008Cad8FC6",
    role: "buyer",
    status: "Active",
    requestedAt: Date.now() - 86400000,
  },
};

async function loadRegistrations(): Promise<Record<string, ServerRoleRegistration>> {
  try {
    const data = await fs.readFile(STORAGE_FILE, "utf-8");
    return { ...DEFAULT_REGISTRATIONS, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_REGISTRATIONS };
  }
}

async function saveRegistrations(regs: Record<string, ServerRoleRegistration>) {
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(regs, null, 2), "utf-8");
  } catch (e) {
    console.error("[RoleRegistration] Failed to persist registrations to file:", e);
  }
}

export async function GET() {
  const registrations = await loadRegistrations();
  return NextResponse.json({ success: true, registrations });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, role, action } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    const registrations = await loadRegistrations();
    const lower = walletAddress.toLowerCase();

    if (action === "register") {
      if (!registrations[lower]) {
        registrations[lower] = {
          walletAddress,
          role: role === "exporter" ? "exporter" : "buyer",
          status: "Pending Approve",
          requestedAt: Date.now(),
        };
        await saveRegistrations(registrations);
      }
    } else if (action === "approve") {
      const existing = registrations[lower] ?? {
        walletAddress,
        role: (role === "exporter" ? "exporter" : "buyer") as "buyer" | "exporter",
        requestedAt: Date.now(),
      };
      registrations[lower] = { ...existing, status: "Active" };
      await saveRegistrations(registrations);
    }

    return NextResponse.json({ success: true, registrations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update role registration" }, { status: 500 });
  }
}
