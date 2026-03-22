"use client";

import { useParams } from "next/navigation";
import { ChatArea } from "@/components/chat/chat-area";

export default function ChatConversationPage() {
  const params = useParams();
  const conversationId =
    typeof params?.id === "string" ? params.id : undefined;

  return (
    <ChatArea conversationId={conversationId} connectedAccounts={[]} />
  );
}
