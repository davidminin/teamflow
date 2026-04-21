import { NextRequest, NextResponse } from "next/server";
import {
  getWorker,
  removeWorker,
  heartbeat,
  updateWorkerStatus,
  validateWorkerApiKey,
} from "@/lib/workers";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workers/[id]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const worker = getWorker(id);
  if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ worker });
}

// PATCH /api/workers/[id] — heartbeat or status update
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!validateWorkerApiKey(request)) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }
  try {
    const body = await request.json();
    if (body.heartbeat) {
      const hbStatus =
        body.status === "idle" || body.status === "busy" ? body.status : undefined;
      const worker = heartbeat(id, hbStatus);
      if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ worker });
    }
    if (body.status === "idle" || body.status === "busy") {
      const worker = updateWorkerStatus(id, body.status);
      if (!worker) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ worker });
    }
    return NextResponse.json({ error: "Send { heartbeat: true } or { status: 'idle'|'busy' }" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}

// DELETE /api/workers/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  if (!validateWorkerApiKey(request)) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }
  if (!removeWorker(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ removed: true, id });
}
