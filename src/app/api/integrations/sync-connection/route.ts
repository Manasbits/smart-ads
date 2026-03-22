import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getSessionForUser } from "@/lib/composio/client";
import { addConnectedAccount } from "@/lib/firestore/users";

const TOOLKIT_TO_PROVIDER: Record<string, "meta_ads" | "shopify"> = {
  METAADS: "meta_ads",
  SHOPIFY: "shopify",
};

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { toolkit } = body;

    if (!toolkit || !TOOLKIT_TO_PROVIDER[toolkit]) {
      return NextResponse.json(
        { error: "Invalid toolkit" },
        { status: 400 }
      );
    }

    const session = await getSessionForUser(userId);
    const result = await session.toolkits();

    const match = result.items.find((item) => item.slug === toolkit);

    if (
      match?.connection?.isActive &&
      match.connection.connectedAccount?.id
    ) {
      await addConnectedAccount(userId, {
        provider: TOOLKIT_TO_PROVIDER[toolkit],
        composioConnectionId: match.connection.connectedAccount.id,
      });

      return NextResponse.json({
        success: true,
        connectedAccountId: match.connection.connectedAccount.id,
      });
    }

    return NextResponse.json({ success: false });
  } catch (error) {
    console.error("[sync-connection] Error:", error);
    return NextResponse.json(
      { error: "Failed to sync connection" },
      { status: 500 }
    );
  }
});
