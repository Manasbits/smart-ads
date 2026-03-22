"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useUIStore } from "@/stores/ui-store";
import { Loader2 } from "lucide-react";
import type { Conversation, Workspace } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const activeWorkspaceId = useUIStore((s) => s.activeWorkspaceId);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract active conversation ID from path
  const activeConversationId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : undefined;

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (activeWorkspaceId) params.set("workspaceId", activeWorkspaceId);

      const [convRes, wsRes] = await Promise.all([
        fetch(`/api/conversations?${params}`),
        fetch("/api/workspaces"),
      ]);

      if (convRes.ok) {
        const data = await convRes.json();
        setConversations(data.conversations || []);
      }
      if (wsRes.ok) {
        const data = await wsRes.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch {
      // Silently handle — data will just be empty
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleNewChat = () => {
    router.push("/chat");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar workspaces={workspaces} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
