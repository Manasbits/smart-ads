import { NextResponse } from "next/server";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import type { UIMessage } from "ai";
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

function textFromParts(parts?: UIMessage["parts"]): string {
  if (!parts?.length) return "";
  return parts
    .filter(
      (p): p is { type: "text"; text: string } =>
        p.type === "text" && typeof (p as { text?: unknown }).text === "string"
    )
    .map((p) => p.text)
    .join("");
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { messages, conversationId, workspaceId, activeAccounts } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const scopeId =
      activeAccounts?.metaAdsAccountId ||
      activeAccounts?.shopifyStoreId ||
      undefined;

    const [memories, tools] = await Promise.all([
      getMemories(userId, scopeId),
      getToolsForUser(userId),
    ]);

    const systemPrompt = buildSystemPrompt({ activeAccounts, memories });

    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const firstUser = messages.find(
        (m: { role: string }) => m.role === "user"
      );
      const title =
        textFromParts(firstUser?.parts).slice(0, 80) || "New conversation";
      activeConversationId = await createConversation(
        userId,
        title,
        workspaceId || null,
        activeAccounts
      );
    }

    const modelMessages = await convertToModelMessages(messages, {
      tools,
      ignoreIncompleteToolCalls: true,
    });

    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(15),
      onError({ error }) {
        console.error("[chat] streamText error:", error);
      },
      async onFinish({ text }) {
        if (!activeConversationId) return;

        try {
          const lastUserMsg = [...messages]
            .reverse()
            .find((m: { role: string }) => m.role === "user");

          const saveOps: Promise<unknown>[] = [];
          const userText = lastUserMsg
            ? textFromParts(lastUserMsg.parts)
            : "";

          if (userText) {
            saveOps.push(
              addMessage(activeConversationId, {
                role: "user",
                content: userText,
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
          saveOps.push(
            updateConversation(activeConversationId, userId, {}).catch(
              () => {}
            )
          );
          await Promise.all(saveOps);

          if (userText && text) {
            extractAndSaveMemories({
              userId,
              conversationId: activeConversationId,
              messageId: "",
              userMessage: userText,
              assistantMessage: text,
              scopeId: scopeId || null,
              workspaceId: workspaceId || null,
            }).catch(() => {});
          }
        } catch (err) {
          console.error("[chat] onFinish save error:", err);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[chat] Route error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
