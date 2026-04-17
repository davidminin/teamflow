import { NextResponse } from "next/server";
import { getAuthHeaders, portalConfig } from "@/lib/config";

export async function GET() {
  if (!portalConfig.n8nApiKey) {
    return NextResponse.json(
      { error: "N8N_API_KEY is not configured." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${portalConfig.n8nApiUrl}/workflows`, {
      headers: { ...getAuthHeaders() },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to load workflows: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to connect to n8n API: ${String(error)}` },
      { status: 502 }
    );
  }
}
