"use client";

import { useParams } from "next/navigation";
import { ChatArea } from "@/components/chat/chat-area";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : undefined;

  // Connected accounts will be fetched from the workspace context
  // For now, pass empty array — accounts will be loaded from settings
  return (
    <ChatArea
      conversationId={conversationId}
      connectedAccounts={[]}
    />
  );
}
