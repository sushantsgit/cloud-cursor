export interface Message {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, string>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface CompletionRequest {
  messages: Message[];
  tools?: ToolDefinition[];
}

export interface CompletionResponse {
  content: string | null;
  toolCalls: ToolCall[];
  finishReason: "stop" | "tool_calls";
}

export interface LLMProvider {
  readonly name: string;
  complete(request: CompletionRequest): Promise<CompletionResponse>;
}

export interface AgentStep {
  type: "thought" | "tool_call" | "tool_result" | "answer";
  content: string;
  toolName?: string;
}

export interface AgentResult {
  answer: string;
  steps: AgentStep[];
  iterations: number;
}
