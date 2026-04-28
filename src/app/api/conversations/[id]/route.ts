import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import {
  archiveConversation,
  updateConversation,
} from "@/lib/firestore/conversations";

export const dynamic = "force-dynamic";

function conversationIdFromPath(pathname: string): string | null {
  const id = pathname.split("/conversations/")[1]?.split("/")[0];
  return id || null;
}

export const PATCH = withAuth(async (req: NextRequest, { userId }) => {
  const id = conversationIdFromPath(req.nextUrl.pathname);
  if (!id) {
    return NextResponse.json(
      { error: "Missing conversation id" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const patch: { title?: string; isStarred?: boolean } = {};

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.isStarred === "boolean") patch.isStarred = body.isStarred;

  if (
    Object.keys(patch).length === 0 ||
    (patch.title !== undefined && patch.title.length === 0)
  ) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  await updateConversation(id, userId, patch);
  return NextResponse.json({ success: true });
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  const id = conversationIdFromPath(req.nextUrl.pathname);
  if (!id) {
    return NextResponse.json(
      { error: "Missing conversation id" },
      { status: 400 }
    );
  }

  await archiveConversation(id, userId);
  return NextResponse.json({ success: true });
});
