"use client";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { SidebarProfileMenu } from "@/components/layout/sidebar-profile-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MessageSquare,
  ChevronLeft,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import type { Conversation } from "@/types";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onToggleStarConversation: (id: string, isStarred: boolean) => void;
  onDeleteConversation: (id: string) => void;
}

function toMillis(raw: unknown): number {
  if (!raw) return 0;
  if (typeof raw === "string") return new Date(raw).getTime();
  if (typeof raw === "object" && raw !== null && "_seconds" in raw) {
    return (raw as { _seconds: number })._seconds * 1000;
  }
  if (
    typeof raw === "object" &&
    raw !== null &&
    "toDate" in raw &&
    typeof (raw as { toDate?: () => Date }).toDate === "function"
  ) {
    return (raw as { toDate: () => Date }).toDate().getTime();
  }
  return 0;
}

function SidebarContent({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectConversation,
  onRenameConversation,
  onToggleStarConversation,
  onDeleteConversation,
  collapsed,
}: SidebarProps & { collapsed: boolean }) {
  const sortedConversations = [...conversations].sort(
    (a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt)
  );
  const starredConversations = sortedConversations.filter((c) => c.isStarred);
  const recentConversations = sortedConversations.filter((c) => !c.isStarred);

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
            onClick={() => onSelectConversation(conv.id)}
            className={cn(
              "h-9 w-9 text-muted-foreground hover:text-foreground",
              activeConversationId === conv.id && "bg-accent text-foreground"
            )}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        ))}
        <div className="mt-auto flex flex-col items-center gap-2 pb-3">
          <SidebarProfileMenu collapsed />
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
        {starredConversations.length > 0 && (
          <div className="mb-4">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Starred
            </p>
            {starredConversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                active={activeConversationId === conv.id}
                onSelect={onSelectConversation}
                onRename={onRenameConversation}
                onToggleStar={onToggleStarConversation}
                onDelete={onDeleteConversation}
              />
            ))}
          </div>
        )}

        <div className="mb-4">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Recents
          </p>
          {recentConversations.map((conv) => (
            <ConversationRow
              key={conv.id}
              conversation={conv}
              active={activeConversationId === conv.id}
              onSelect={onSelectConversation}
              onRename={onRenameConversation}
              onToggleStar={onToggleStarConversation}
              onDelete={onDeleteConversation}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Bottom nav */}
      <div className="p-2 space-y-0.5">
        <Separator className="mb-2" />
        <SidebarProfileMenu collapsed={false} />
      </div>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  onSelect,
  onRename,
  onToggleStar,
  onDelete,
}: {
  conversation: Conversation;
  active: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onToggleStar: (id: string, isStarred: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const title = conversation.title || "New conversation";
  const isStarred = !!conversation.isStarred;

  const handleRename = () => {
    const nextTitle = window.prompt("Rename chat", title);
    if (!nextTitle) return;
    const trimmed = nextTitle.trim();
    if (!trimmed || trimmed === title) return;
    onRename(conversation.id, trimmed);
  };

  const handleDelete = () => {
    const ok = window.confirm(`Delete "${title}"?`);
    if (ok) onDelete(conversation.id);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-lg px-2 py-1.5",
        "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        "transition-colors duration-150",
        active && "bg-accent text-foreground border-l-2 border-primary"
      )}
    >
      <button
        onClick={() => onSelect(conversation.id)}
        className="min-w-0 flex-1 truncate text-left text-sm"
      >
        {title}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={handleRename}>
            <Pencil className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onToggleStar(conversation.id, !isStarred)}
          >
            <Star className="h-4 w-4 mr-2" />
            {isStarred ? "Remove star" : "Add to stars"}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const { sidebarOpen, mobileNavOpen, setMobileNavOpen, toggleSidebar } =
    useUIStore();

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
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
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
