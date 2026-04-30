import type { Memory, ActiveAccountContext } from "@/types";
import type { Skill } from "@/lib/skills/types";
import { SMARTADS_META_PLAYBOOK } from "@/lib/ai/meta-playbook-snippet";

interface PromptContext {
  activeAccounts?: ActiveAccountContext;
  accountNames?: { metaAds?: string; shopify?: string };
  memories: Memory[];
  skills?: Skill[];
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const parts: string[] = [
    `You are SmartAds AI — an expert practitioner for Meta Ads and Shopify ecommerce.`,
    `You coach brand owners and agencies toward profitable scale: you connect what they see in Ads Manager with what hits their bank account and their store.`,
    ``,
    SMARTADS_META_PLAYBOOK,
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

  if (ctx.skills && ctx.skills.length > 0) {
    parts.push(
      `\nAvailable skills (call activate_skill to load full instructions before proceeding):`
    );
    for (const skill of ctx.skills) {
      parts.push(`- ${skill.name}: ${skill.description}`);
    }
  }

  parts.push(`\nRules:`);
  parts.push(`- Only query or modify the active accounts listed above.`);
  parts.push(
    `- Never access data from accounts not listed in the active context.`
  );
  parts.push(
    `- When providing insights, reference specific metrics and numbers from tools when available.`
  );
  parts.push(
    `- If the user asks about Meta Ads or Shopify data but the relevant account is not connected, do NOT attempt to use tools. Instead, respond: "You'll need to connect your [Provider] account first. Go to [Settings](/settings?tab=integrations) to connect it."`
  );
  parts.push(
    `- Format data in tables when comparing metrics across campaigns or time periods.`
  );
  parts.push(
    `- Be thorough but scannable: lead with what they should do or understand, then back it with data or reasoning.`
  );

  parts.push(
    `- Respond using clear markdown only. Do not output chart or mermaid code blocks.`
  );

  return parts.join("\n");
}
