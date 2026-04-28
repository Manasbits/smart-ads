import { NextResponse } from "next/server";
import { streamText, stepCountIs, convertToModelMessages } from "ai";
import type { UIMessage, ToolSet } from "ai";
import { withAuth } from "@/lib/auth/with-auth";
import { getModel } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { buildMetaTools } from "@/lib/ai/tools/meta";
import { buildShopifyTools } from "@/lib/ai/tools/shopify";
import { buildSkillTools } from "@/lib/ai/tools/skills";
import { SkillRegistry } from "@/lib/skills/registry";
import { getMemories } from "@/lib/firestore/memory";
import {
  createConversation,
  addMessage,
  updateConversation,
} from "@/lib/firestore/conversations";
import { extractAndSaveMemories } from "@/lib/memory/manager";

const registry = new SkillRegistry();

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
    const { messages, conversationId, activeAccounts, forcedSkill } = body;

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

    const [memories, skills, tools] = await Promise.all([
      getMemories(userId, scopeId),
      registry.list(userId),
      Promise.all([
        buildMetaTools(userId),
        buildShopifyTools(userId),
        buildSkillTools(userId, registry),
      ]).then(
        ([metaTools, shopifyTools, skillTools]) =>
          ({ ...metaTools, ...shopifyTools, ...skillTools }) as ToolSet
      ),
    ]);

    const systemPrompt = buildSystemPrompt({ activeAccounts, memories, skills });

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
        activeAccounts
      );
    }

    const modelMessages = await convertToModelMessages(messages, {
      tools,
      ignoreIncompleteToolCalls: true,
    });

    if (forcedSkill) {
      const skill = await registry.get(userId, forcedSkill);
      if (skill) {
        modelMessages.unshift(
          {
            role: 'assistant' as const,
            content: [{
              type: 'tool-call' as const,
              toolCallId: 'forced-skill',
              toolName: 'activate_skill',
              input: { name: forcedSkill },
            }],
          },
          {
            role: 'tool' as const,
            content: [{
              type: 'tool-result' as const,
              toolCallId: 'forced-skill',
              toolName: 'activate_skill',
              output: {
                type: 'text' as const,
                value: `<skill_content name="${forcedSkill}">\n${skill.content}\n</skill_content>`,
              },
            }],
          }
        );
      }
    }

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
