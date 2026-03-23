import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getTokenMeta } from "@/lib/firestore/tokens";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  try {
    const [metaMeta, shopifyMeta] = await Promise.all([
      getTokenMeta(userId, "meta_ads"),
      getTokenMeta(userId, "shopify"),
    ]);

    const connections = [
      {
        provider: "meta_ads",
        name: "Meta Ads",
        isActive: metaMeta !== null,
        metadata: metaMeta
          ? {
              metaUserId: metaMeta.metaUserId,
              adAccounts: metaMeta.adAccounts,
              tokenExpiresAt: metaMeta.tokenExpiresAt,
            }
          : null,
      },
      {
        provider: "shopify",
        name: "Shopify",
        isActive: shopifyMeta !== null,
        metadata: shopifyMeta
          ? {
              shopDomain: shopifyMeta.shopDomain,
              shopName: shopifyMeta.shopName,
            }
          : null,
      },
    ];

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("[connections] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
});
