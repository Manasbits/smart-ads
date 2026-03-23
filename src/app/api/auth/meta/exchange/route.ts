import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import {
  verifyOAuthState,
  exchangeCodeForShortLivedToken,
  exchangeForLongLivedToken,
  fetchMetaUserAndAccounts,
} from "@/lib/oauth/meta";
import { saveMetaToken } from "@/lib/firestore/tokens";
import { addConnectedAccount } from "@/lib/firestore/users";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { code, state } = body as { code?: string; state?: string };

    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    // Verify CSRF state
    const stateData = verifyOAuthState(state);
    if (!stateData || stateData.userId !== userId || stateData.provider !== "meta") {
      return NextResponse.json({ error: "Invalid or expired state" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const redirectUri = `${appUrl}/auth/callback`;

    // Exchange code → short-lived token → long-lived token (60 days)
    const { accessToken: shortToken } = await exchangeCodeForShortLivedToken(
      code,
      redirectUri
    );
    const { accessToken: longToken, expiresIn } =
      await exchangeForLongLivedToken(shortToken);

    // Fetch user info + ad accounts
    const { userId: metaUserId, adAccounts } =
      await fetchMetaUserAndAccounts(longToken);

    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Persist encrypted token in Firestore
    await saveMetaToken(userId, {
      accessToken: longToken,
      tokenExpiresAt: expiresAt,
      metaUserId,
      adAccounts,
      scopes: ["ads_read", "ads_management", "business_management"],
    });

    await addConnectedAccount(userId, {
      provider: "meta_ads",
      connectionId: metaUserId,
    });

    return NextResponse.json({ success: true, adAccountCount: adAccounts.length });
  } catch (error) {
    console.error("[meta/exchange] Error:", error);
    const message = error instanceof Error ? error.message : "Failed to connect Meta Ads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
