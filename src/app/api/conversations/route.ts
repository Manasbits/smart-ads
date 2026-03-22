export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import {
  createConversation,
  listConversations,
} from "@/lib/firestore/conversations";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const { conversations } = await listConversations(
    userId,
    workspaceId,
    undefined,
    limit
  );

  // Serialize Firestore Timestamps to ISO strings
  const serialized = conversations.map((c) => ({
    ...c,
    createdAt: c.createdAt?.toDate?.().toISOString() ?? null,
    updatedAt: c.updatedAt?.toDate?.().toISOString() ?? null,
  }));

  return NextResponse.json({ conversations: serialized });
});

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const { title, workspaceId, activeAccountContext } = body;

  const conversationId = await createConversation(
    userId,
    title || "New conversation",
    workspaceId,
    activeAccountContext
  );

  return NextResponse.json({ conversationId }, { status: 201 });
});
