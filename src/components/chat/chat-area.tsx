"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useChat, type UseChatOptions } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useUIStore } from "@/stores/ui-store";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { AccountSelector } from "@/components/chat/account-selector";
import { Zap, BarChart3, ShoppingBag, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ConnectedAccount } from "@/types";

interface ChatAreaProps {
  conversationId?: string;
  connectedAccounts: ConnectedAccount[];
}

const SUGGESTIONS = [
  { icon: BarChart3, text: "How are my Meta Ads performing this week?" },
  { icon: ShoppingBag, text: "Show me top-selling products on Shopify" },
  { icon: TrendingUp, text: "Compare ROAS across my campaigns" },
];

export function ChatArea({ conversationId, connectedAccounts }: ChatAreaProps) {
  const { user } = useAuthContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const historyLoadedFor = useRef<string | undefined>(undefined);

  const activeWorkspaceId = useUIStore((s) => s.activeWorkspaceId);
  const activeMetaAdsAccountId = useUIStore((s) => s.activeMetaAdsAccountId);
  const activeShopifyStoreId = useUIStore((s) => s.activeShopifyStoreId);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        credentials: "include",
        body: {
          conversationId,
          workspaceId: activeWorkspaceId,
          activeAccounts: {
            metaAdsAccountId: activeMetaAdsAccountId,
            shopifyStoreId: activeShopifyStoreId,
          },
        },
      }),
    [
      conversationId,
      activeWorkspaceId,
      activeMetaAdsAccountId,
      activeShopifyStoreId,
    ]
  );

  const chatOptions: UseChatOptions<UIMessage> = useMemo(
    () => ({
      id: conversationId ?? "new",
      transport,
      onError: (err: Error) => {
        console.error("[chat] Client error:", err);
        toast.error(err.message || "Chat request failed");
      },
    }),
    [conversationId, transport]
  );

  const { messages, sendMessage, status, setMessages } = useChat(chatOptions);

  // Load past messages when opening an existing conversation
  useEffect(() => {
    if (!conversationId || historyLoadedFor.current === conversationId) return;

    let cancelled = false;
    setLoadingHistory(true);

    (async () => {
      try {
        const res = await fetch(
          `/api/conversations/${conversationId}/messages`,
          { credentials: "include" }
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;

        const uiMessages: UIMessage[] = (data.messages ?? []).map(
          (m: { id: string; role: string; content: string }, i: number) => ({
            id: m.id || `history-${i}`,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: m.content || "" }],
          })
        );
        setMessages(uiMessages);
        historyLoadedFor.current = conversationId;
      } catch {
        // Non-critical — chat will work without history
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => { cancelled = true; };
  }, [conversationId, setMessages]);

  const isLoading = status === "submitted" || status === "streaming";

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSuggestionClick = (text: string) => {
    sendMessage({ text });
  };

  const onSubmit = () => {
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  if (loadingHistory) {
    return (
      <div className="flex flex-col h-full">
        <AccountSelector connectedAccounts={connectedAccounts} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <AccountSelector connectedAccounts={connectedAccounts} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
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
          <div className="max-w-3xl mx-auto py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role as "user" | "assistant"}
                parts={message.parts}
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
