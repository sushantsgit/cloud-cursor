import { describe, expect, it } from "vitest";
import { Agent } from "../src/agent/Agent.js";
import { MockProvider } from "../src/providers/mock.js";
import { calculatorTool, knowledgeLookupTool } from "../src/tools/index.js";

describe("tools", () => {
  it("evaluates safe math expressions", () => {
    expect(calculatorTool.execute({ expression: "12 * 7" })).toContain("84");
  });

  it("rejects unsafe calculator input", () => {
    expect(() => calculatorTool.execute({ expression: "process.exit()" })).toThrow();
  });

  it("returns knowledge base entries", () => {
    const result = knowledgeLookupTool.execute({ topic: "rag" });
    expect(result.toLowerCase()).toContain("retrieval");
  });
});

describe("Agent with MockProvider", () => {
  const agent = new Agent({ provider: new MockProvider() });

  it("uses the calculator tool for math questions", async () => {
    const result = await agent.run("Please calculate 9 + 4");

    expect(result.answer).toContain("13");
    expect(result.steps.some((step) => step.type === "tool_call" && step.toolName === "calculator")).toBe(
      true,
    );
  });

  it("uses knowledge lookup for explain-style questions", async () => {
    const result = await agent.run("Tell me about TypeScript");

    expect(result.answer.toLowerCase()).toContain("typescript");
    expect(
      result.steps.some((step) => step.type === "tool_call" && step.toolName === "knowledge_lookup"),
    ).toBe(true);
  });

  it("greets the user without tools", async () => {
    const result = await agent.run("Hello there");

    expect(result.answer.toLowerCase()).toContain("promptforge");
    expect(result.steps.some((step) => step.type === "tool_call")).toBe(false);
  });
});
