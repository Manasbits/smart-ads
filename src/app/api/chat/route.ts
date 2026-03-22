import { streamText, stepCountIs } from "ai";
import { withAuth } from "@/lib/auth/with-auth";
import { getModel } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { getToolsForUser } from "@/lib/composio/client";
import { getMemories } from "@/lib/firestore/memory";
import {
  createConversation,
  addMessage,
  updateConversation,
} from "@/lib/firestore/conversations";
import { extractAndSaveMemories } from "@/lib/memory/manager";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes — Fluid Compute

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const { messages, conversationId, workspaceId, activeAccounts } = body;

  // Load scoped memories
  const scopeId =
    activeAccounts?.metaAdsAccountId ||
    activeAccounts?.shopifyStoreId ||
    undefined;

  const [memories, tools] = await Promise.all([
    getMemories(userId, scopeId),
    getToolsForUser(userId),
  ]);

  // Build system prompt
  const systemPrompt = buildSystemPrompt({
    activeAccounts,
    memories,
  });

  // Create conversation if this is the first message
  let activeConversationId = conversationId;
  if (!activeConversationId && messages.length > 0) {
    const firstUserMessage = messages.find(
      (m: { role: string }) => m.role === "user"
    );
    const title = firstUserMessage?.content?.slice(0, 80) || "New conversation";
    activeConversationId = await createConversation(
      userId,
      title,
      workspaceId || null,
      activeAccounts
    );
  }

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages,
    tools,
    stopWhen: stepCountIs(15),
    async onFinish({ text }) {
      if (!activeConversationId) return;

      // Find the last user message
      const lastUserMsg = [...messages]
        .reverse()
        .find((m: { role: string }) => m.role === "user");

      // Save messages to Firestore (non-blocking)
      const saveOps: Promise<unknown>[] = [];

      if (lastUserMsg) {
        saveOps.push(
          addMessage(activeConversationId, {
            role: "user",
            content: lastUserMsg.content || "",
          })
        );
      }

      if (text) {
        saveOps.push(
          addMessage(activeConversationId, {
            role: "assistant",
            content: text,
          })
        );
      }

      // Update conversation timestamp
      saveOps.push(
        updateConversation(activeConversationId, userId, {}).catch(() => {
          // Non-critical
        })
      );

      await Promise.all(saveOps);

      // Extract memories (non-blocking, fire-and-forget)
      if (lastUserMsg?.content && text) {
        extractAndSaveMemories({
          userId,
          conversationId: activeConversationId,
          messageId: "",
          userMessage: lastUserMsg.content,
          assistantMessage: text,
          scopeId: scopeId || null,
          workspaceId: workspaceId || null,
        }).catch(() => {
          // Non-critical
        });
      }
    },
  });

  return result.toUIMessageStreamResponse();
});
