"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  MessageSquare,
  Settings,
  Layers,
  ChevronLeft,
} from "lucide-react";
import type { Conversation } from "@/types";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onNewChat: () => void;
}

function groupConversations(conversations: Conversation[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: Conversation[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 Days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conv of conversations) {
    // updatedAt can be a Firestore Timestamp, ISO string, or epoch
    const raw = conv.updatedAt;
    const date = raw
      ? typeof raw === "string"
        ? new Date(raw)
        : typeof raw === "object" && "_seconds" in raw
          ? new Date((raw as { _seconds: number })._seconds * 1000)
          : raw?.toDate?.()
            ? raw.toDate()
            : new Date(0)
      : new Date(0);
    if (date >= today) groups[0].items.push(conv);
    else if (date >= yesterday) groups[1].items.push(conv);
    else if (date >= weekAgo) groups[2].items.push(conv);
    else groups[3].items.push(conv);
  }

  return groups.filter((g) => g.items.length > 0);
}

function SidebarContent({
  conversations,
  activeConversationId,
  onNewChat,
  collapsed,
}: SidebarProps & { collapsed: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  const groups = groupConversations(conversations);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-3 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Separator className="my-1 w-6" />
        {conversations.slice(0, 10).map((conv) => (
          <Button
            key={conv.id}
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/chat/${conv.id}`)}
            className={cn(
              "h-9 w-9 text-muted-foreground hover:text-foreground",
              activeConversationId === conv.id && "bg-accent text-foreground"
            )}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        ))}
        <div className="mt-auto flex flex-col items-center gap-2 pb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/workspaces")}
            className={cn(
              "h-9 w-9 text-muted-foreground hover:text-foreground",
              pathname === "/workspaces" && "bg-accent text-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/settings")}
            className={cn(
              "h-9 w-9 text-muted-foreground hover:text-foreground",
              pathname === "/settings" && "bg-accent text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* New chat button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2 h-9 text-sm border-dashed"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1 px-2">
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {group.label}
            </p>
            {group.items.map((conv) => (
              <button
                key={conv.id}
                onClick={() => router.push(`/chat/${conv.id}`)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-lg text-sm truncate",
                  "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  "transition-colors duration-150",
                  activeConversationId === conv.id &&
                    "bg-accent text-foreground border-l-2 border-primary"
                )}
              >
                {conv.title || "New conversation"}
              </button>
            ))}
          </div>
        ))}
      </ScrollArea>

      {/* Bottom nav */}
      <div className="p-2 space-y-0.5">
        <Separator className="mb-2" />
        <Button
          variant="ghost"
          onClick={() => router.push("/workspaces")}
          className={cn(
            "w-full justify-start gap-2 h-9 text-sm text-muted-foreground hover:text-foreground",
            pathname === "/workspaces" && "bg-accent text-foreground"
          )}
        >
          <Layers className="h-4 w-4" />
          Workspaces
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push("/settings")}
          className={cn(
            "w-full justify-start gap-2 h-9 text-sm text-muted-foreground hover:text-foreground",
            pathname === "/settings" && "bg-accent text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-border bg-sidebar h-full",
          "transition-[width] duration-200 ease-in-out",
          sidebarOpen ? "w-[280px]" : "w-[60px]"
        )}
      >
        <div className="flex items-center justify-between p-3 h-14">
          {sidebarOpen && (
            <span className="text-sm font-semibold tracking-tight">
              SmartAds
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 text-muted-foreground hover:text-foreground ml-auto"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                !sidebarOpen && "rotate-180"
              )}
            />
          </Button>
        </div>
        <SidebarContent {...props} collapsed={!sidebarOpen} />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-[280px] p-0 bg-sidebar md:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex items-center p-3 h-14">
            <span className="text-sm font-semibold tracking-tight">
              SmartAds
            </span>
          </div>
          <SidebarContent {...props} collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}
