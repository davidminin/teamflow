import { NextRequest, NextResponse } from "next/server";
import {
  createTask,
  listTasks,
  getTask,
  dispatchTask,
  createAndDispatch,
  updateTaskResult,
  clickupEventToTask,
} from "@/lib/tasks";

// GET /api/tasks — list all tasks
export async function GET(request: NextRequest) {
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50", 10);
  const allTasks = listTasks(limit);

  const summary = {
    total: allTasks.length,
    pending: allTasks.filter((t) => t.status === "pending").length,
    dispatched: allTasks.filter((t) => t.status === "dispatched").length,
    completed: allTasks.filter((t) => t.status === "completed").length,
    failed: allTasks.filter((t) => t.status === "failed").length,
  };

  return NextResponse.json({ tasks: allTasks, summary });
}

// POST /api/tasks — create + optionally dispatch a task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Mode 1: Convert a ClickUp event to a task
    if (body.clickupEvent) {
      const taskInput = clickupEventToTask(body.clickupEvent);
      if (!taskInput) {
        return NextResponse.json(
          { skipped: true, reason: "Event does not map to a task" },
          { status: 200 }
        );
      }
      const task = await createAndDispatch(taskInput);
      return NextResponse.json({ task }, { status: 201 });
    }

    // Mode 2: Direct task creation
    const { type, title, requirement, branch, baseBranch, filePaths, dispatch } = body;

    if (!type || !requirement) {
      return NextResponse.json(
        { error: "Missing required fields: type, requirement" },
        { status: 400 }
      );
    }

    const task = createTask({
      type,
      title: title || requirement.slice(0, 80),
      requirement,
      branch,
      baseBranch,
      filePaths,
    });

    // Auto-dispatch if requested (default: true)
    if (dispatch !== false) {
      await dispatchTask(task);
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

// PATCH /api/tasks — update task result (called by workers via portal)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, result, status } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const task = updateTaskResult(taskId, result, status || "completed");
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
