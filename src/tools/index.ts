import type { ToolDefinition } from "../types.js";

export interface ToolHandler {
  definition: ToolDefinition;
  execute(args: Record<string, unknown>): Promise<string> | string;
}

const KNOWLEDGE_BASE: Record<string, string> = {
  typescript:
    "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds static types, interfaces, and better tooling.",
  "cursor agent":
    "Cursor Cloud Agents run autonomously in the cloud: they clone your repo, create branches, implement changes, run tests, and open pull requests.",
  rag: "Retrieval-Augmented Generation (RAG) combines a search step with an LLM so answers are grounded in your own documents.",
  embeddings:
    "Embeddings are dense vector representations of text. Similar meanings map to nearby points in vector space.",
};

function safeEvaluate(expression: string): number {
  const sanitized = expression.replace(/\s+/g, "");
  if (!/^[\d.+\-*/()]+$/.test(sanitized)) {
    throw new Error(`Unsafe expression: ${expression}`);
  }

  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${sanitized})`)();
  if (typeof result !== "number" || !Number.isFinite(result)) {
    throw new Error(`Expression did not evaluate to a finite number: ${expression}`);
  }
  return result;
}

export const calculatorTool: ToolHandler = {
  definition: {
    name: "calculator",
    description: "Evaluate a basic arithmetic expression",
    parameters: {
      expression: "A math expression like 12 * 7 or (3+4)/2",
    },
  },
  execute(args) {
    const expression = String(args.expression ?? "");
    const value = safeEvaluate(expression);
    return `The result of ${expression} is ${value}.`;
  },
};

export const knowledgeLookupTool: ToolHandler = {
  definition: {
    name: "knowledge_lookup",
    description: "Look up a short explanation from the built-in knowledge base",
    parameters: {
      topic: "The topic to look up, e.g. typescript or rag",
    },
  },
  execute(args) {
    const topic = String(args.topic ?? "").toLowerCase().trim();
    const entry = KNOWLEDGE_BASE[topic];

    if (!entry) {
      const suggestions = Object.keys(KNOWLEDGE_BASE).join(", ");
      return `No entry for "${topic}". Known topics: ${suggestions}.`;
    }

    return entry;
  },
};

export const defaultTools: ToolHandler[] = [calculatorTool, knowledgeLookupTool];

export function getToolByName(name: string): ToolHandler | undefined {
  return defaultTools.find((tool) => tool.definition.name === name);
}
