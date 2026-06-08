import type {
  CompletionRequest,
  CompletionResponse,
  LLMProvider,
  Message,
  ToolCall,
} from "../types.js";

/**
 * Deterministic mock LLM for local dev and tests — no API key required.
 * Parses simple intent from the latest user message and returns tool calls or a final answer.
 */
export class MockProvider implements LLMProvider {
  readonly name = "mock";

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const userMessage = [...request.messages]
      .reverse()
      .find((m) => m.role === "user");

    if (!userMessage) {
      return { content: "I did not receive a question.", toolCalls: [], finishReason: "stop" };
    }

    const text = userMessage.content.toLowerCase();
    const hasToolResults = request.messages.some((m) => m.role === "tool");

    if (!hasToolResults && this.shouldUseCalculator(text)) {
      const expression = this.extractExpression(userMessage.content);
      return {
        content: null,
        toolCalls: [
          {
            id: "call_calc_1",
            name: "calculator",
            arguments: { expression },
          },
        ],
        finishReason: "tool_calls",
      };
    }

    if (!hasToolResults && this.shouldLookupTopic(text)) {
      const topic = this.extractTopic(userMessage.content);
      return {
        content: null,
        toolCalls: [
          {
            id: "call_kb_1",
            name: "knowledge_lookup",
            arguments: { topic },
          },
        ],
        finishReason: "tool_calls",
      };
    }

    const toolContext = this.summarizeToolResults(request.messages);
    const answer = toolContext
      ? `Based on my tools: ${toolContext}`
      : this.directAnswer(userMessage.content);

    return { content: answer, toolCalls: [], finishReason: "stop" };
  }

  private shouldUseCalculator(text: string): boolean {
    return /\d/.test(text) && /(\+|−|-|×|\*|\/|divide|plus|times|calculate|math)/i.test(text);
  }

  private shouldLookupTopic(text: string): boolean {
    return /(what is|tell me about|explain|define|lookup|look up)/i.test(text);
  }

  private extractExpression(text: string): string {
    const match = text.match(/([\d.]+)\s*([+\-*/×])\s*([\d.]+)/);
    if (match) {
      const operator = match[2] === "×" ? "*" : match[2];
      return `${match[1]}${operator}${match[3]}`;
    }
    return "2+2";
  }

  private extractTopic(text: string): string {
    const cleaned = text
      .replace(/^(what is|tell me about|explain|define|lookup|look up)\s+/i, "")
      .replace(/[?.!]+$/, "")
      .trim();
    return cleaned || "typescript";
  }

  private summarizeToolResults(messages: Message[]): string | null {
    const results = messages.filter((m) => m.role === "tool");
    if (results.length === 0) return null;
    return results.map((m) => m.content).join(" ");
  }

  private directAnswer(text: string): string {
    if (/hello|hi\b/i.test(text)) {
      return "Hello! I am PromptForge, a tiny tool-using agent. Ask me to calculate something or explain a topic.";
    }
    return `I can help with math or knowledge lookups. You asked: "${text}"`;
  }
}

/** Exported for tests that need to inspect mock behavior. */
export function parseMockToolCalls(response: CompletionResponse): ToolCall[] {
  return response.toolCalls;
}
