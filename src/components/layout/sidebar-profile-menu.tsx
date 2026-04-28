"use client";

import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { useUIStore } from "@/stores/ui-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Link2, Sparkles, Moon, Sun, LogOut } from "lucide-react";

export function SidebarProfileMenu({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const { user, signOut } = useAuthContext();
  const { theme, toggleTheme } = useTheme();
  const setActiveShellView = useUIStore((s) => s.setActiveShellView);

  const initials =
    user?.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const openView = (view: "profile" | "integrations" | "skills") => {
    setActiveShellView(view);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar className="h-9 w-9 cursor-pointer">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium truncate">
              {user?.displayName || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openView("profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openView("integrations")}>
            <Link2 className="mr-2 h-4 w-4" />
            Integrations
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openView("skills")}>
            <Sparkles className="mr-2 h-4 w-4" />
            Skills
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="w-full h-auto justify-start gap-2 rounded-lg px-2 py-2"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-medium leading-4">
                {user?.displayName || "User"}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => openView("profile")}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openView("integrations")}>
          <Link2 className="mr-2 h-4 w-4" />
          Integrations
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openView("skills")}>
          <Sparkles className="mr-2 h-4 w-4" />
          Skills
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
