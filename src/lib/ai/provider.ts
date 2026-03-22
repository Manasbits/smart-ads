import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export function getModel() {
  const modelId = process.env.LLM_MODEL || "anthropic/claude-sonnet-4-6";
  return openrouter(modelId);
}
