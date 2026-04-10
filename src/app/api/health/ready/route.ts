import { NextResponse } from "next/server";
import { checkDbHealth } from "@/infrastructure/sqlite/sqlite-client";

export async function GET() {
  try {
    checkDbHealth();
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json(
      { status: "error", detail: "database not accessible" },
      { status: 503 }
    );
  }
}
