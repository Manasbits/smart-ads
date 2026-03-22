import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getSessionForUser } from "@/lib/composio/client";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  try {
    const session = await getSessionForUser(userId);
    const result = await session.toolkits();

    const connections = result.items.map((item) => ({
      name: item.name,
      slug: item.slug,
      isActive: item.connection?.isActive ?? false,
      logo: item.logo,
      connectedAccount: item.connection?.connectedAccount
        ? {
            id: item.connection.connectedAccount.id,
            status: item.connection.connectedAccount.status,
          }
        : undefined,
    }));

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("[connections] Error:", error);

    // If Composio is down or not configured, return empty gracefully
    if (
      error instanceof Error &&
      error.message.includes("COMPOSIO_API_KEY")
    ) {
      return NextResponse.json({ connections: [], configured: false });
    }

    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
});
