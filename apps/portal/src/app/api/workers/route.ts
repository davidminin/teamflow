import { NextRequest, NextResponse } from "next/server";
import {
  registerWorker,
  listWorkers,
  findAvailableWorker,
  dispatchToWorker,
  type RegisterWorkerPayload,
  type TaskPayload,
} from "@/lib/workers";

// GET /api/workers — list all registered workers
export async function GET() {
  const workers = listWorkers();
  const summary = {
    total: workers.length,
    idle: workers.filter((w) => w.status === "idle").length,
    busy: workers.filter((w) => w.status === "busy").length,
    offline: workers.filter((w) => w.status === "offline").length,
  };
  return NextResponse.json({ workers, summary });
}

// POST /api/workers — register a worker or dispatch a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Dispatch mode: { action: "dispatch", task: { ... }, capability?: "..." }
    if (body.action === "dispatch") {
      const task = body.task as TaskPayload;
      if (!task?.taskId || !task?.type) {
        return NextResponse.json(
          { error: "Missing task.taskId or task.type" },
          { status: 400 }
        );
      }

      const worker = findAvailableWorker(body.capability);
      if (!worker) {
        return NextResponse.json(
          { error: "No available workers", workers: listWorkers() },
          { status: 503 }
        );
      }

      const result = await dispatchToWorker(worker, task);
      return NextResponse.json({
        dispatched: true,
        workerId: worker.id,
        workerName: worker.name,
        ...result,
      });
    }

    // Registration mode
    const { name, endpoint, capabilities, metadata } =
      body as RegisterWorkerPayload;

    if (!name || !endpoint) {
      return NextResponse.json(
        { error: "Missing required fields: name, endpoint" },
        { status: 400 }
      );
    }

    // Validate endpoint URL
    try {
      new URL(endpoint);
    } catch {
      return NextResponse.json(
        { error: "Invalid endpoint URL" },
        { status: 400 }
      );
    }

    const worker = registerWorker({ name, endpoint, capabilities, metadata });
    return NextResponse.json({ registered: true, worker }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
