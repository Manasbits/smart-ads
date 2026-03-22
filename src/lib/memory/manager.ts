import { generateText } from "ai";
import { getModel } from "@/lib/ai/provider";
import {
  saveMemory,
  findSimilarMemory,
  updateMemory,
} from "@/lib/firestore/memory";

const EXTRACTION_PROMPT = `Analyze this conversation turn and extract any of the following if present:
- Business insights (performance data, trends, anomalies the user discussed)
- User preferences (reporting style, favorite metrics, thresholds they mentioned)
- Strategic decisions (pausing campaigns, budget changes, targeting shifts)

Return ONLY valid JSON with no markdown formatting: { "memories": [{ "category": "business_context" | "preference" | "insight", "content": "concise summary" }] }
If nothing worth remembering, return: { "memories": [] }`;

export async function extractAndSaveMemories(params: {
  userId: string;
  conversationId: string;
  messageId: string;
  userMessage: string;
  assistantMessage: string;
  scopeId: string | null;
  workspaceId: string | null;
}) {
  try {
    const { text } = await generateText({
      model: getModel(),
      prompt: `${EXTRACTION_PROMPT}\n\nUser: ${params.userMessage}\nAssistant: ${params.assistantMessage}`,
      maxOutputTokens: 500,
    });

    // Strip markdown code fences if present
    const cleanText = text.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanText);
    if (!parsed.memories?.length) return;

    for (const mem of parsed.memories) {
      const existing = await findSimilarMemory(
        params.userId,
        params.scopeId,
        mem.category,
        mem.content
      );

      if (existing) {
        await updateMemory(existing.id, params.userId, mem.content);
      } else {
        await saveMemory({
          userId: params.userId,
          scope: params.scopeId ? "account" : "global",
          scopeId: params.scopeId,
          workspaceId: params.workspaceId,
          category: mem.category,
          content: mem.content,
          source: {
            conversationId: params.conversationId,
            messageId: params.messageId,
          },
        });
      }
    }
  } catch (error) {
    console.error(
      "[memory] extraction failed:",
      JSON.stringify({ userId: params.userId, error: String(error) })
    );
    // Non-critical — don't fail the chat
  }
}
