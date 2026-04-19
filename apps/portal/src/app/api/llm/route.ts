import { NextResponse } from "next/server";
import {
  checkAllProviders,
  chatCompletion,
  getConfiguredProviders,
} from "@/lib/llm";

/**
 * GET /api/llm — List providers and their health status
 */
export async function GET() {
  try {
    const statuses = await checkAllProviders();

    return NextResponse.json({
      providers: statuses.map((s) => ({
        id: s.provider.id,
        name: s.provider.name,
        type: s.provider.type,
        baseUrl: s.provider.baseUrl,
        defaultModel: s.provider.defaultModel,
        enabled: s.provider.enabled,
        healthy: s.healthy,
        latencyMs: s.latencyMs,
        availableModels: s.availableModels,
        error: s.error,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llm — Test completion or run a prompt
 * Body: { action: "test" | "complete", provider?: string, messages?: [...], prompt?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, provider, messages, prompt } = body;

    if (action === "test") {
      // Quick test: send a simple prompt and return the response
      const result = await chatCompletion(
        {
          messages: [
            { role: "system", content: "You are a helpful assistant. Reply in one short sentence." },
            { role: "user", content: "Say hello and confirm you are working." },
          ],
          maxTokens: 50,
        },
        provider || undefined
      );

      return NextResponse.json({
        success: true,
        response: result.content,
        model: result.model,
        usage: result.usage,
      });
    }

    if (action === "complete") {
      if (!messages && !prompt) {
        return NextResponse.json(
          { error: "Provide 'messages' array or 'prompt' string." },
          { status: 400 }
        );
      }

      const chatMessages = messages || [
        { role: "user", content: prompt },
      ];

      const result = await chatCompletion(
        {
          messages: chatMessages,
          model: body.model,
          temperature: body.temperature,
          maxTokens: body.maxTokens,
        },
        provider || undefined
      );

      return NextResponse.json({
        success: true,
        content: result.content,
        model: result.model,
        usage: result.usage,
        finishReason: result.finishReason,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'test' or 'complete'." },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
