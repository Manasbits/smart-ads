import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { deleteToken } from "@/lib/firestore/tokens";
import { removeConnectedAccount } from "@/lib/firestore/users";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { provider } = body as { provider?: string };

    if (provider !== "meta_ads" && provider !== "shopify") {
      return NextResponse.json(
        { error: "provider must be 'meta_ads' or 'shopify'" },
        { status: 400 }
      );
    }

    await Promise.all([
      deleteToken(userId, provider),
      removeConnectedAccount(userId, provider),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[disconnect] Error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }
});
