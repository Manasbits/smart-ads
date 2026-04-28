"use client";

import { useUIStore } from "@/stores/ui-store";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { PanelLeft } from "lucide-react";

export function Topbar() {
  const { sidebarOpen, toggleSidebar, setMobileNavOpen } = useUIStore();

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
      </div>

      <UserMenu />
    </header>
  );
}
