import { buildSystemPrompt } from "../prompts/system.js";
import { defaultTools, getToolByName } from "../tools/index.js";
import type {
  AgentResult,
  AgentStep,
  LLMProvider,
  Message,
} from "../types.js";

export interface AgentOptions {
  provider: LLMProvider;
  maxIterations?: number;
  verbose?: boolean;
}

export class Agent {
  private readonly provider: LLMProvider;
  private readonly maxIterations: number;
  private readonly verbose: boolean;

  constructor(options: AgentOptions) {
    this.provider = options.provider;
    this.maxIterations = options.maxIterations ?? 5;
    this.verbose = options.verbose ?? false;
  }

  async run(userInput: string): Promise<AgentResult> {
    const tools = defaultTools.map((tool) => tool.definition);
    const messages: Message[] = [
      { role: "system", content: buildSystemPrompt(tools) },
      { role: "user", content: userInput },
    ];
    const steps: AgentStep[] = [];
    let iterations = 0;

    while (iterations < this.maxIterations) {
      iterations += 1;

      const response = await this.provider.complete({ messages, tools });

      if (response.toolCalls.length > 0) {
        messages.push({
          role: "assistant",
          content: response.content ?? "",
        });

        for (const call of response.toolCalls) {
          const step: AgentStep = {
            type: "tool_call",
            content: JSON.stringify(call.arguments),
            toolName: call.name,
          };
          steps.push(step);

          if (this.verbose) {
            console.error(`[tool] ${call.name}(${step.content})`);
          }

          const handler = getToolByName(call.name);
          const result = handler
            ? await handler.execute(call.arguments)
            : `Unknown tool: ${call.name}`;

          steps.push({ type: "tool_result", content: result, toolName: call.name });

          messages.push({
            role: "tool",
            content: result,
            toolCallId: call.id,
            toolName: call.name,
          });
        }

        continue;
      }

      const answer =
        response.content?.trim() ||
        "I could not produce an answer. Try rephrasing your question.";

      steps.push({ type: "answer", content: answer });
      return { answer, steps, iterations };
    }

    const fallback = "I hit the iteration limit before finishing.";
    steps.push({ type: "answer", content: fallback });
    return { answer: fallback, steps, iterations };
  }
}
