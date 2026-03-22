import { streamText } from "ai";
import { withAuth } from "@/lib/auth/with-auth";
import { getModel } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { getToolsForUser } from "@/lib/composio/client";
import { getMemories } from "@/lib/firestore/memory";
import type { ChatRequestBody } from "@/types";

export const maxDuration = 300; // 5 minutes — Fluid Compute

export const POST = withAuth(async (req, { userId }) => {
  const body: ChatRequestBody = await req.json();
  const { messages, activeAccounts } = body;

  // Load scoped memories
  const scopeId =
    activeAccounts?.metaAdsAccountId ||
    activeAccounts?.shopifyStoreId ||
    undefined;

  const memories = await getMemories(userId, scopeId);

  // Get Composio tools for this user
  const tools = await getToolsForUser(userId);

  // Build system prompt
  const systemPrompt = buildSystemPrompt({
    activeAccounts,
    memories,
  });

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages,
    tools,
    maxSteps: 15,
  });

  return result.toDataStreamResponse();
});
