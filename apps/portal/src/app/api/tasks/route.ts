import { NextResponse } from "next/server";

const CLICKUP_API = "https://api.clickup.com/api/v2";

function getConfig() {
  const token = process.env.CLICKUP_API_TOKEN;
  const listId = process.env.CLICKUP_LIST_ID;
  return { token, listId };
}

function clickupHeaders(token: string) {
  return {
    Authorization: token,
    "Content-Type": "application/json",
  };
}

// GET /api/tasks — fetch tasks from ClickUp list
export async function GET() {
  const { token, listId } = getConfig();

  if (!token || !listId) {
    return NextResponse.json(
      {
        error:
          "ClickUp not configured. Set CLICKUP_API_TOKEN and CLICKUP_LIST_ID.",
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(
      `${CLICKUP_API}/list/${listId}/task?order_by=created&reverse=true&subtasks=true`,
      {
        headers: clickupHeaders(token),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `ClickUp API error: ${response.status} ${text}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ tasks: data.tasks || [] });
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to connect to ClickUp: ${String(error)}` },
      { status: 502 }
    );
  }
}

// POST /api/tasks — create a new task in ClickUp
export async function POST(request: Request) {
  const { token, listId } = getConfig();

  if (!token || !listId) {
    return NextResponse.json(
      {
        error:
          "ClickUp not configured. Set CLICKUP_API_TOKEN and CLICKUP_LIST_ID.",
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: "Task name is required" },
        { status: 400 }
      );
    }

    const clickupPayload: Record<string, unknown> = {
      name: body.name.trim(),
      description: body.description || "",
      priority: body.priority || 3,
      tags: body.tags || [],
      status: "Open",
    };

    const response = await fetch(`${CLICKUP_API}/list/${listId}/task`, {
      method: "POST",
      headers: clickupHeaders(token),
      body: JSON.stringify(clickupPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `ClickUp API error: ${response.status} ${text}` },
        { status: response.status }
      );
    }

    const task = await response.json();
    return NextResponse.json(
      { message: "Task created", task },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create task: ${String(error)}` },
      { status: 500 }
    );
  }
}
