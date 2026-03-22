import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { disconnectAccount } from "@/lib/composio/client";
import { removeConnectedAccount } from "@/lib/firestore/users";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { connectedAccountId } = body;

    if (!connectedAccountId || typeof connectedAccountId !== "string") {
      return NextResponse.json(
        { error: "connectedAccountId is required" },
        { status: 400 }
      );
    }

    // Disconnect from Composio (revokes tokens)
    await disconnectAccount(connectedAccountId);

    // Remove from Firestore
    await removeConnectedAccount(userId, connectedAccountId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[disconnect] Error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }
});
