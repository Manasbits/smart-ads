import { tool } from "ai";
import { z } from "zod";
import { getMetaToken } from "@/lib/firestore/tokens";
import { MetaApiClient } from "@/lib/api/meta-client";

/**
 * Builds Meta Ads tools for a given user.
 * Returns an empty object if the user has no Meta token (graceful degradation).
 */
export async function buildMetaTools(userId: string) {
  const tokenData = await getMetaToken(userId).catch(() => null);
  if (!tokenData) return {};

  const client = new MetaApiClient(tokenData.accessToken);

  return {
    get_meta_ad_accounts: tool({
      description:
        "List all Meta Ads ad accounts connected to the user's Meta account. Returns account IDs, names, and currency.",
      inputSchema: z.object({}),
      execute: async () => {
        return tokenData.adAccounts;
      },
    }),

    get_meta_campaigns: tool({
      description:
        "Get campaigns for a Meta Ads account with their status, objective, budget, and spend. Use this to see all campaigns.",
      inputSchema: z.object({
        accountId: z
          .string()
          .describe(
            "The Meta Ads account ID (e.g. 'act_1234567890'). Get this from get_meta_ad_accounts."
          ),
        status: z
          .enum(["ACTIVE", "PAUSED", "ALL"])
          .optional()
          .default("ALL")
          .describe("Filter by campaign status"),
      }),
      execute: async ({ accountId, status }) => {
        const fields = [
          "id",
          "name",
          "status",
          "effective_status",
          "objective",
          "daily_budget",
          "lifetime_budget",
          "budget_remaining",
          "start_time",
          "stop_time",
          "created_time",
        ].join(",");

        const params: Record<string, string> = { fields, limit: "50" };
        if (status && status !== "ALL") {
          params.effective_status = `["${status}"]`;
        }

        const data = await client.get<{ data: unknown[] }>(
          `/${accountId}/campaigns`,
          params
        );
        return data.data;
      },
    }),

    get_meta_adsets: tool({
      description:
        "Get ad sets for a campaign. Returns audience targeting, budget, optimization goal, and schedule.",
      inputSchema: z.object({
        campaignId: z.string().describe("The campaign ID"),
      }),
      execute: async ({ campaignId }) => {
        const fields = [
          "id",
          "name",
          "status",
          "effective_status",
          "daily_budget",
          "lifetime_budget",
          "optimization_goal",
          "billing_event",
          "bid_strategy",
          "start_time",
          "end_time",
        ].join(",");

        const data = await client.get<{ data: unknown[] }>(
          `/${campaignId}/adsets`,
          { fields, limit: "50" }
        );
        return data.data;
      },
    }),

    get_meta_ads: tool({
      description:
        "Get individual ads for an ad set. Returns ad name, status, and creative info.",
      inputSchema: z.object({
        adsetId: z.string().describe("The ad set ID"),
      }),
      execute: async ({ adsetId }) => {
        const fields = [
          "id",
          "name",
          "status",
          "effective_status",
          "created_time",
          "updated_time",
        ].join(",");

        const data = await client.get<{ data: unknown[] }>(
          `/${adsetId}/ads`,
          { fields, limit: "50" }
        );
        return data.data;
      },
    }),

    get_meta_insights: tool({
      description:
        "Get performance metrics (spend, ROAS, CTR, CPM, CPP, impressions, clicks, purchases) for a campaign, ad set, or ad. This is the key tool for performance analysis.",
      inputSchema: z.object({
        entityId: z
          .string()
          .describe(
            "ID of the campaign, ad set, ad, or account to get insights for"
          ),
        datePreset: z
          .enum([
            "today",
            "yesterday",
            "last_3d",
            "last_7d",
            "last_14d",
            "last_30d",
            "last_90d",
            "this_month",
            "last_month",
          ])
          .optional()
          .default("last_7d")
          .describe("Date range preset for the metrics"),
        breakdown: z
          .enum(["age", "gender", "publisher_platform", "device_platform", "region", "none"])
          .optional()
          .default("none")
          .describe("Optional breakdown dimension for segmented analysis"),
      }),
      execute: async ({ entityId, datePreset, breakdown }) => {
        const fields = [
          "spend",
          "impressions",
          "reach",
          "clicks",
          "cpm",
          "cpc",
          "ctr",
          "cpp",
          "purchase_roas",
          "actions",
          "action_values",
          "frequency",
          "date_start",
          "date_stop",
        ].join(",");

        const params: Record<string, string> = {
          fields,
          date_preset: datePreset ?? "last_7d",
          limit: "100",
        };

        if (breakdown && breakdown !== "none") {
          params.breakdowns = breakdown;
        }

        const data = await client.get<{ data: unknown[] }>(
          `/${entityId}/insights`,
          params
        );
        return data.data;
      },
    }),
  };
}
