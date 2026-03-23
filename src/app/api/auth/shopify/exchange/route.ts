import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import {
  verifyShopifyHmac,
  exchangeShopifyCode,
  fetchShopInfo,
} from "@/lib/oauth/shopify";
import { verifyOAuthState } from "@/lib/oauth/meta";
import { saveShopifyToken } from "@/lib/firestore/tokens";
import { addConnectedAccount } from "@/lib/firestore/users";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { code, shop, state, hmac, timestamp } = body as {
      code?: string;
      shop?: string;
      state?: string;
      hmac?: string;
      timestamp?: string;
    };

    if (!code || !shop || !state || !hmac || !timestamp) {
      return NextResponse.json(
        { error: "Missing required Shopify callback parameters" },
        { status: 400 }
      );
    }

    // Reconstruct URLSearchParams for HMAC verification
    const params = new URLSearchParams({ code, shop, state, hmac, timestamp });
    if (!verifyShopifyHmac(params)) {
      return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 401 });
    }

    // Verify CSRF state
    const stateData = verifyOAuthState(state);
    if (!stateData || stateData.userId !== userId || stateData.provider !== "shopify") {
      return NextResponse.json({ error: "Invalid or expired state" }, { status: 400 });
    }

    // Exchange code for permanent Shopify token
    const accessToken = await exchangeShopifyCode(shop, code);

    // Fetch shop info
    const shopInfo = await fetchShopInfo(shop, accessToken);

    // Persist encrypted token
    await saveShopifyToken(userId, {
      accessToken,
      shopDomain: shop,
      shopName: shopInfo.name,
      scopes: ["read_orders", "read_products", "read_analytics", "read_customers"],
    });

    await addConnectedAccount(userId, {
      provider: "shopify",
      connectionId: shop,
    });

    return NextResponse.json({ success: true, shopName: shopInfo.name });
  } catch (error) {
    console.error("[shopify/exchange] Error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to connect Shopify";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
