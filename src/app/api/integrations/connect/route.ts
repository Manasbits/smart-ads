import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { buildMetaAuthUrl, createOAuthState } from "@/lib/oauth/meta";
import { buildShopifyAuthUrl, normalizeShopDomain } from "@/lib/oauth/shopify";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { provider, shopDomain } = body as {
      provider?: string;
      shopDomain?: string;
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const redirectUri = `${appUrl}/auth/callback`;

    if (provider === "meta") {
      const state = createOAuthState(userId, "meta");
      const redirectUrl = buildMetaAuthUrl(state, redirectUri);
      return NextResponse.json({ redirectUrl });
    }

    if (provider === "shopify") {
      if (!shopDomain) {
        return NextResponse.json(
          { error: "shopDomain is required for Shopify" },
          { status: 400 }
        );
      }
      const shop = normalizeShopDomain(shopDomain);
      const state = createOAuthState(userId, "shopify");
      const redirectUrl = buildShopifyAuthUrl(shop, state, redirectUri);
      return NextResponse.json({ redirectUrl });
    }

    return NextResponse.json(
      { error: "Invalid provider. Must be 'meta' or 'shopify'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[connect] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to initiate connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
