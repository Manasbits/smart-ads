"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ShellCenterPanel } from "@/components/panels/shell-center-panel";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useUIStore } from "@/stores/ui-store";
import { Loader2 } from "lucide-react";
import type { ConnectedAccount, Conversation } from "@/types";

export default function DashboardLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const activeShellView = useUIStore((s) => s.activeShellView);
  const setActiveShellView = useUIStore((s) => s.setActiveShellView);
  const selectedConversationId = useUIStore((s) => s.selectedConversationId);
  const setSelectedConversationId = useUIStore((s) => s.setSelectedConversationId);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [convRes, integrationsRes] = await Promise.all([
        fetch("/api/conversations"),
        fetch("/api/integrations/connections", { credentials: "include" }),
      ]);

      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data.conversations || []);
      }
      if (integrationsRes.ok) {
        const data = await integrationsRes.json();
        const accounts: ConnectedAccount[] = [];
        const connections = Array.isArray(data.connections) ? data.connections : [];

        for (const c of connections) {
          if (c?.provider === "meta_ads" && c?.isActive) {
            const adAccounts = c.metadata?.adAccounts ?? [];
            for (const acc of adAccounts) {
              accounts.push({
                provider: "meta_ads",
                accountId: acc.id,
                accountName: acc.name ?? acc.id,
                connectionId: `meta-${acc.id}`,
              });
            }
          }
          if (c?.provider === "shopify" && c?.isActive) {
            const domain = c.metadata?.shopDomain;
            if (domain) {
              accounts.push({
                provider: "shopify",
                accountId: domain,
                accountName: c.metadata?.shopName ?? domain,
                connectionId: `shopify-${domain}`,
              });
            }
          }
        }
        setConnectedAccounts(accounts);
      }
    } catch {
      // Silently handle — data will just be empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  useEffect(() => {
    if (pathname.startsWith("/settings")) setActiveShellView("profile");
    else if (pathname.startsWith("/chat")) setActiveShellView("chat");
  }, [pathname, setActiveShellView]);

  useEffect(() => {
    if (!selectedConversationId) {
      const fromPath = pathname.startsWith("/chat/")
        ? pathname.split("/chat/")[1]
        : null;
      if (fromPath) {
        setSelectedConversationId(fromPath);
      } else if (conversations.length > 0) {
        setSelectedConversationId(conversations[0].id);
      }
    }
  }, [pathname, conversations, selectedConversationId, setSelectedConversationId]);

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleNewChat = () => {
    setSelectedConversationId(null);
    setActiveShellView("chat");
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setActiveShellView("chat");
  };

  const handleRenameConversation = async (id: string, title: string) => {
    const previous = conversations;
    setConversations((curr) =>
      curr.map((c) => (c.id === id ? { ...c, title } : c))
    );
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to rename chat");
    } catch {
      setConversations(previous);
    }
  };

  const handleToggleStarConversation = async (id: string, isStarred: boolean) => {
    const previous = conversations;
    setConversations((curr) =>
      curr.map((c) => (c.id === id ? { ...c, isStarred } : c))
    );
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred }),
      });
      if (!res.ok) throw new Error("Failed to star chat");
    } catch {
      setConversations(previous);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    const previous = conversations;
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (selectedConversationId === id) {
      setSelectedConversationId(remaining[0]?.id ?? null);
    }
    try {
      const res = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete chat");
    } catch {
      setConversations(previous);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={selectedConversationId ?? undefined}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onRenameConversation={handleRenameConversation}
        onToggleStarConversation={handleToggleStarConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-hidden">
          <ShellCenterPanel
            activeView={activeShellView}
            conversationId={selectedConversationId ?? undefined}
            connectedAccounts={connectedAccounts}
          />
        </main>
      </div>
    </div>
  );
}
