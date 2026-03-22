"use client";

import { useAuthContext } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Link as LinkIcon, Plus } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuthContext();

  const initials =
    user?.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const handleConnectMetaAds = () => {
    toast.info("Meta Ads connection will be available once Composio is configured.");
  };

  const handleConnectShopify = () => {
    toast.info("Shopify connection will be available once Composio is configured.");
  };

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold tracking-tight mb-6">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.photoURL || undefined} />
                  <AvatarFallback className="text-lg bg-muted">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="font-medium">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Google Account
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">
                  Connected Accounts
                </h3>
                <p className="text-xs text-muted-foreground">
                  Connect your Meta Ads and Shopify accounts to use AI tools.
                </p>
              </div>

              <Separator />

              {/* Meta Ads */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Meta Ads</p>
                      <p className="text-xs text-muted-foreground">
                        Manage campaigns, view insights, and optimize ad spend
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleConnectMetaAds}
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Connect
                  </Button>
                </div>
              </div>

              {/* Shopify */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-emerald-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M15.337 3.415c-.144-.073-.31-.04-.427.047-.028.02-.06.047-.09.073-.4.33-.845.554-1.3.737.166-.58.31-1.25.31-1.91 0-.047-.004-.093-.007-.14-.003-.046-.01-.093-.016-.14-.09-.68-.53-1.01-.99-1.07h-.09c-.34 0-.75.17-1.14.47-.32.24-.62.56-.88.93-.4-.1-.8-.17-1.18-.2.02-.72.08-1.39.16-1.87.03-.17-.02-.35-.14-.48-.12-.13-.3-.2-.47-.19-.68.04-1.27.58-1.72 1.5-.15.31-.28.67-.38 1.06-.95.22-1.6.38-1.62.38-.47.13-.49.14-.55.58C4.4 5.88 2 21.27 2 21.27l12.31 2.15.14-.02V3.5c-.38-.02-.76-.05-1.11-.08z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Shopify</p>
                      <p className="text-xs text-muted-foreground">
                        Track orders, products, and customer analytics
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleConnectShopify}
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
