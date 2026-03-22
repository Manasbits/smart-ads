import type { Memory, ActiveAccountContext } from "@/types";

interface PromptContext {
  activeAccounts?: ActiveAccountContext;
  accountNames?: { metaAds?: string; shopify?: string };
  memories: Memory[];
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const parts: string[] = [
    `You are SmartAds AI, an expert assistant for Meta Ads and Shopify e-commerce marketing.`,
    `You help brand owners and agencies analyze campaign performance, optimize ad spend, track orders, and make data-driven marketing decisions.`,
  ];

  if (
    ctx.activeAccounts?.metaAdsAccountId ||
    ctx.activeAccounts?.shopifyStoreId
  ) {
    parts.push(`\nActive context:`);
    if (ctx.activeAccounts.metaAdsAccountId) {
      parts.push(
        `- Meta Ads Account: ${ctx.accountNames?.metaAds || ctx.activeAccounts.metaAdsAccountId}`
      );
    }
    if (ctx.activeAccounts.shopifyStoreId) {
      parts.push(
        `- Shopify Store: ${ctx.accountNames?.shopify || ctx.activeAccounts.shopifyStoreId}`
      );
    }
  }

  if (ctx.memories.length > 0) {
    parts.push(`\nRelevant context from previous conversations:`);
    for (const mem of ctx.memories) {
      parts.push(`- [${mem.category}] ${mem.content}`);
    }
  }

  parts.push(`\nRules:`);
  parts.push(`- Only query or modify the active accounts listed above.`);
  parts.push(
    `- Never access data from accounts not listed in the active context.`
  );
  parts.push(`- When providing insights, reference specific metrics and numbers.`);
  parts.push(
    `- If the user asks about an account that isn't connected, suggest they connect it in Settings.`
  );
  parts.push(
    `- Format data in tables when comparing metrics across campaigns or time periods.`
  );
  parts.push(
    `- Be concise but thorough. Lead with the key insight, then supporting data.`
  );

  return parts.join("\n");
}
