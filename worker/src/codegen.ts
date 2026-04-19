/**
 * Code Generation Engine
 *
 * Given a requirement + file context from the repo, uses an LLM to generate
 * code changes. Returns a list of file upserts ready for GitHub commit.
 */

import { chat } from "./llm.js";

export interface FileContext {
  path: string;
  content: string;
}

export interface CodeChange {
  path: string;
  content: string;
  action: "create" | "update";
}

export interface CodeGenRequest {
  requirement: string;
  relevantFiles: FileContext[];
  repoStructure?: string;
  branch?: string;
}

export interface CodeGenResult {
  changes: CodeChange[];
  commitMessage: string;
  summary: string;
  model: string;
}

const SYSTEM_PROMPT = `You are a senior full-stack developer working on a Next.js 15 monorepo called TeamFlow.

Tech stack: Next.js App Router, TypeScript, Tailwind CSS, Prisma, NextAuth.js v4.

When given a requirement and relevant source files, produce the exact code changes needed.

RULES:
- Only output files that need to change
- Output complete file contents (not diffs/patches)
- Follow existing code style and patterns exactly
- Use TypeScript strict mode
- Keep changes minimal and focused
- If a requirement is ambiguous, make reasonable assumptions

OUTPUT FORMAT (strict JSON, no markdown):
{
  "changes": [
    { "path": "apps/portal/src/...", "content": "full file content", "action": "update" }
  ],
  "commitMessage": "feat: short imperative description",
  "summary": "1-2 sentence summary of what changed and why"
}`;

function buildPrompt(req: CodeGenRequest): string {
  let prompt = `## Requirement\n${req.requirement}\n\n`;

  if (req.repoStructure) {
    prompt += `## Repository Structure\n\`\`\`\n${req.repoStructure}\n\`\`\`\n\n`;
  }

  if (req.relevantFiles.length > 0) {
    prompt += `## Relevant Files\n\n`;
    for (const f of req.relevantFiles) {
      prompt += `### ${f.path}\n\`\`\`typescript\n${f.content}\n\`\`\`\n\n`;
    }
  }

  if (req.branch) {
    prompt += `## Context\nWorking on branch: ${req.branch}\n`;
  }

  prompt += `\nGenerate the code changes. Output ONLY valid JSON, no markdown fences.`;
  return prompt;
}

export async function generateCode(req: CodeGenRequest): Promise<CodeGenResult> {
  console.log(`[codegen] Generating code for: "${req.requirement.slice(0, 80)}..."`);
  console.log(`[codegen] Context: ${req.relevantFiles.length} files provided`);

  const response = await chat([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildPrompt(req) },
  ]);

  console.log(`[codegen] LLM response from model: ${response.model}`);

  // Parse JSON from response (handle potential markdown fences)
  let jsonStr = response.content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let parsed: { changes: CodeChange[]; commitMessage: string; summary: string };
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    console.error("[codegen] Failed to parse LLM response as JSON:", jsonStr.slice(0, 500));
    throw new Error(`LLM returned invalid JSON: ${(e as Error).message}`);
  }

  if (!Array.isArray(parsed.changes) || parsed.changes.length === 0) {
    throw new Error("LLM returned no code changes");
  }

  console.log(`[codegen] Generated ${parsed.changes.length} file changes`);
  return { ...parsed, model: response.model };
}
