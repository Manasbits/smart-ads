import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  extraBody: {
    reasoning: {
      // Global default thinking budget for OpenRouter.
      max_tokens: 10000,
    },
  },
});

export function getModel() {
  const modelId = process.env.LLM_MODEL || "anthropic/claude-3.5-sonnet";

  return openrouter(modelId, {
    extraBody: {
      reasoning: {
        max_tokens: 15000,
      },
      provider: {
        order: ["amazon-bedrock"],
        data_collection: "deny",
      },
    },
  });
}
