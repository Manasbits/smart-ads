"use client";

import { useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useUIStore } from "@/stores/ui-store";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { AccountSelector } from "@/components/chat/account-selector";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, BarChart3, ShoppingBag, TrendingUp } from "lucide-react";
import type { ConnectedAccount } from "@/types";

interface ChatAreaProps {
  conversationId?: string;
  connectedAccounts: ConnectedAccount[];
  initialMessages?: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
  }>;
}

const SUGGESTIONS = [
  {
    icon: BarChart3,
    text: "How are my Meta Ads performing this week?",
  },
  {
    icon: ShoppingBag,
    text: "Show me top-selling products on Shopify",
  },
  {
    icon: TrendingUp,
    text: "Compare ROAS across my campaigns",
  },
];

export function ChatArea({
  conversationId,
  connectedAccounts,
  initialMessages,
}: ChatAreaProps) {
  const { user } = useAuthContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeWorkspaceId = useUIStore((s) => s.activeWorkspaceId);
  const activeMetaAdsAccountId = useUIStore((s) => s.activeMetaAdsAccountId);
  const activeShopifyStoreId = useUIStore((s) => s.activeShopifyStoreId);

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    append,
  } = useChat({
    api: "/api/chat",
    id: conversationId,
    initialMessages,
    body: {
      conversationId,
      workspaceId: activeWorkspaceId,
      activeAccounts: {
        metaAdsAccountId: activeMetaAdsAccountId,
        shopifyStoreId: activeShopifyStoreId,
      },
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSuggestionClick = (text: string) => {
    append({ role: "user", content: text });
  };

  const onSubmit = () => {
    if (!input.trim() || isLoading) return;
    handleSubmit();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Account selector */}
      <AccountSelector connectedAccounts={connectedAccounts} />

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full px-4">
            <div className="max-w-lg w-full space-y-8 text-center">
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  How can I help with your marketing today?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ask about your Meta Ads campaigns, Shopify orders, or
                  marketing performance.
                </p>
              </div>

              <div className="grid gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors text-left text-sm group"
                  >
                    <suggestion.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                      {suggestion.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="max-w-3xl mx-auto py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role as "user" | "assistant"}
                content={message.content}
                toolInvocations={message.toolInvocations?.map((t) => ({
                  toolName: t.toolName,
                  args: t.args as Record<string, unknown>,
                  result: "result" in t ? t.result : undefined,
                  state: t.state as "call" | "partial-call" | "result",
                }))}
                userPhotoURL={
                  message.role === "user"
                    ? user?.photoURL || undefined
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
