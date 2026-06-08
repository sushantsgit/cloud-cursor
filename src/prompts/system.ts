import type { ToolDefinition } from "../types.js";

export function buildSystemPrompt(tools: ToolDefinition[]): string {
  const toolList = tools
    .map((tool) => `- ${tool.name}: ${tool.description}`)
    .join("\n");

  return [
    "You are PromptForge, a helpful AI assistant with access to tools.",
    "Use tools when they help answer the user accurately.",
    "When you have enough information, reply with a concise final answer.",
    "",
    "Available tools:",
    toolList,
  ].join("\n");
}
