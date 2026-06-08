import type {
  CompletionRequest,
  CompletionResponse,
  LLMProvider,
  ToolCall,
} from "../types.js";

interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

/**
 * Optional OpenAI-compatible provider. Set OPENAI_API_KEY to use real completions.
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model ?? "gpt-4o-mini";
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const body = {
      model: this.model,
      messages: request.messages.map((m) => ({
        role: m.role === "tool" ? "tool" : m.role,
        content: m.content,
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
      })),
      tools: request.tools?.map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: "object",
            properties: Object.fromEntries(
              Object.entries(tool.parameters).map(([key, desc]) => [
                key,
                { type: "string", description: desc },
              ]),
            ),
            required: Object.keys(tool.parameters),
          },
        },
      })),
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{
        finish_reason: string;
        message: {
          content: string | null;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
    };

    const choice = data.choices[0];
    const toolCalls: ToolCall[] =
      choice.message.tool_calls?.map((call) => ({
        id: call.id,
        name: call.function.name,
        arguments: JSON.parse(call.function.arguments) as Record<string, unknown>,
      })) ?? [];

    return {
      content: choice.message.content,
      toolCalls,
      finishReason: toolCalls.length > 0 ? "tool_calls" : "stop",
    };
  }
}
