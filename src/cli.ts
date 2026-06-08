#!/usr/bin/env node
import { Agent } from "./agent/Agent.js";
import { createProvider } from "./providers/index.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const question = args.filter((arg) => arg !== "--verbose").join(" ").trim();

  if (!question) {
    console.log(`PromptForge — sample AI agent CLI

Usage:
  npm run dev -- "What is 15 * 8?"
  npm run dev -- --verbose "Tell me about RAG"

Provider:
  Uses OPENAI_API_KEY when set, otherwise the built-in mock provider.
`);
    process.exit(0);
  }

  const provider = createProvider();
  const agent = new Agent({ provider, verbose });
  const result = await agent.run(question);

  if (verbose) {
    console.error(`\n[provider: ${provider.name}] [iterations: ${result.iterations}]\n`);
    for (const step of result.steps) {
      const label =
        step.type === "tool_call"
          ? `tool_call(${step.toolName})`
          : step.type === "tool_result"
            ? `tool_result(${step.toolName})`
            : step.type;
      console.error(`  ${label}: ${step.content}`);
    }
    console.error("");
  }

  console.log(result.answer);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exit(1);
});
