"use client";

import { useUIStore } from "@/stores/ui-store";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PanelLeft, ChevronDown, Layers } from "lucide-react";
import type { Workspace } from "@/types";

interface TopbarProps {
  workspaces: Workspace[];
}

export function Topbar({ workspaces }: TopbarProps) {
  const {
    sidebarOpen,
    toggleSidebar,
    setMobileNavOpen,
    activeWorkspaceId,
    setActiveWorkspaceId,
  } = useUIStore();

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        {/* Sidebar toggle — only show on desktop when collapsed, always on mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // On mobile, open the sheet
            if (window.innerWidth < 768) {
              setMobileNavOpen(true);
            } else {
              toggleSidebar();
            }
          }}
          className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        {!sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Workspace selector */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="gap-2 text-sm text-muted-foreground hover:text-foreground h-8"
              >
                <Layers className="h-4 w-4" />
                {activeWorkspace?.name || "All Workspaces"}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={() => setActiveWorkspaceId(null)}>
              All Workspaces
            </DropdownMenuItem>
            {workspaces.length > 0 && <DropdownMenuSeparator />}
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => setActiveWorkspaceId(ws.id)}
              >
                <span className="mr-2">{ws.icon || "📁"}</span>
                {ws.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UserMenu />
    </header>
  );
}
