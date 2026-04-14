import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "portal",
    timestamp: new Date().toISOString(),
  });
}
