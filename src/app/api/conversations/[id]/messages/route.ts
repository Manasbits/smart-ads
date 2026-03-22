import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import {
  getConversation,
  getMessages,
} from "@/lib/firestore/conversations";

export const dynamic = "force-dynamic";

export const GET = withAuth(
  async (req: NextRequest, { userId }: { userId: string }) => {
    const id = req.nextUrl.pathname.split("/conversations/")[1]?.split("/")[0];
    if (!id) {
      return NextResponse.json(
        { error: "Missing conversation id" },
        { status: 400 }
      );
    }

    const conversation = await getConversation(id, userId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const { messages } = await getMessages(id);
    return NextResponse.json({ messages });
  }
);
