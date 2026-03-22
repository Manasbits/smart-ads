"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Loader2, CheckCircle2, Unplug } from "lucide-react";
import { toast } from "sonner";

interface ConnectionInfo {
  name: string;
  slug: string;
  isActive: boolean;
  logo?: string;
  connectedAccount?: {
    id: string;
    status: string;
  };
}

export default function SettingsPage() {
  const { user } = useAuthContext();
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [composioConfigured, setComposioConfigured] = useState<boolean | null>(
    null
  );
  const [connectingToolkit, setConnectingToolkit] = useState<string | null>(
    null
  );
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/connections", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setConnections(data.connections ?? []);
      setComposioConfigured(data.configured !== false);
    } catch {
      try {
        const res = await fetch("/api/integrations/status", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setComposioConfigured(Boolean(data.composioApiKeyConfigured));
        }
      } catch {
        setComposioConfigured(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const initials =
    user?.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const handleConnect = async (toolkit: string) => {
    if (composioConfigured === false) {
      toast.error(
        "COMPOSIO_API_KEY is not configured on the server. Add it to .env.local and restart."
      );
      return;
    }

    setConnectingToolkit(toolkit);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit, from: "/settings" }),
      });

      const data = await res.json();

      if (!res.ok || !data.redirectUrl) {
        toast.error(data.error || "Failed to start connection");
        return;
      }

      window.location.href = data.redirectUrl;
    } catch {
      toast.error("Failed to initiate connection");
    } finally {
      setConnectingToolkit(null);
    }
  };

  const handleDisconnect = async (connectedAccountId: string) => {
    setDisconnectingId(connectedAccountId);
    try {
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectedAccountId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to disconnect");
        return;
      }

      toast.success("Account disconnected");
      await fetchConnections();
    } catch {
      toast.error("Failed to disconnect account");
    } finally {
      setDisconnectingId(null);
    }
  };

  const metaConnection = connections.find((c) => c.slug === "METAADS");
  const shopifyConnection = connections.find((c) => c.slug === "SHOPIFY");

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold tracking-tight mb-6">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>

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

          <TabsContent value="integrations" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">
                  Connected Accounts
                </h3>
                <p className="text-xs text-muted-foreground">
                  Connect your Meta Ads and Shopify accounts to use AI
                  tools.
                </p>
              </div>

              {composioConfigured === false && (
                <p className="text-xs rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 px-3 py-2">
                  Composio is not configured on the server:{" "}
                  <code className="text-amber-100/90">COMPOSIO_API_KEY</code>{" "}
                  is missing or empty.
                </p>
              )}

              <Separator />

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <IntegrationCard
                    name="Meta Ads"
                    slug="METAADS"
                    description="Manage campaigns, view insights, and optimize ad spend"
                    iconColor="blue"
                    iconPath="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"
                    connection={metaConnection}
                    onConnect={() => handleConnect("METAADS")}
                    onDisconnect={handleDisconnect}
                    connecting={connectingToolkit === "METAADS"}
                    disconnectingId={disconnectingId}
                  />

                  <IntegrationCard
                    name="Shopify"
                    slug="SHOPIFY"
                    description="Track orders, products, and customer analytics"
                    iconColor="emerald"
                    iconPath="M15.337 3.415c-.144-.073-.31-.04-.427.047-.028.02-.06.047-.09.073-.4.33-.845.554-1.3.737.166-.58.31-1.25.31-1.91 0-.047-.004-.093-.007-.14-.003-.046-.01-.093-.016-.14-.09-.68-.53-1.01-.99-1.07h-.09c-.34 0-.75.17-1.14.47-.32.24-.62.56-.88.93-.4-.1-.8-.17-1.18-.2.02-.72.08-1.39.16-1.87.03-.17-.02-.35-.14-.48-.12-.13-.3-.2-.47-.19-.68.04-1.27.58-1.72 1.5-.15.31-.28.67-.38 1.06-.95.22-1.6.38-1.62.38-.47.13-.49.14-.55.58C4.4 5.88 2 21.27 2 21.27l12.31 2.15.14-.02V3.5c-.38-.02-.76-.05-1.11-.08z"
                    connection={shopifyConnection}
                    onConnect={() => handleConnect("SHOPIFY")}
                    onDisconnect={handleDisconnect}
                    connecting={connectingToolkit === "SHOPIFY"}
                    disconnectingId={disconnectingId}
                  />
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface IntegrationCardProps {
  name: string;
  slug: string;
  description: string;
  iconColor: "blue" | "emerald";
  iconPath: string;
  connection?: ConnectionInfo;
  onConnect: () => void;
  onDisconnect: (connectedAccountId: string) => void;
  connecting: boolean;
  disconnectingId: string | null;
}

function IntegrationCard({
  name,
  slug,
  description,
  iconColor,
  iconPath,
  connection,
  onConnect,
  onDisconnect,
  connecting,
  disconnectingId,
}: IntegrationCardProps) {
  const isActive = connection?.isActive ?? false;
  const connectedAccountId = connection?.connectedAccount?.id;
  const colorClasses =
    iconColor === "blue"
      ? { bg: "bg-blue-500/10", text: "text-blue-400" }
      : { bg: "bg-emerald-500/10", text: "text-emerald-400" };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`h-10 w-10 rounded-lg ${colorClasses.bg} flex items-center justify-center`}
          >
            <svg
              className={`h-5 w-5 ${colorClasses.text}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d={iconPath} />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        {isActive ? (
          <Badge
            variant="secondary"
            className="text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        ) : (
          <Button
            onClick={onConnect}
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Connect
          </Button>
        )}
      </div>

      {isActive && connectedAccountId && (
        <div className="flex items-center justify-between pl-13 ml-0.5">
          <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
            {connectedAccountId}
          </p>
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-destructive hover:text-destructive gap-1 h-7"
                  disabled={disconnectingId === connectedAccountId}
                />
              }
            >
              {disconnectingId === connectedAccountId ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Unplug className="h-3 w-3" />
              )}
              Disconnect
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Disconnect {name}?</DialogTitle>
                <DialogDescription>
                  This will revoke access to this {name} account. Any
                  active chats using this account will lose tool access.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <DialogClose
                  render={<Button variant="destructive" />}
                  onClick={() => onDisconnect(connectedAccountId)}
                >
                  Disconnect
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {isActive && (
        <div className="pl-13 ml-0.5">
          <Button
            onClick={onConnect}
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7 px-0"
            disabled={connecting}
          >
            <Plus className="h-3 w-3" />
            Connect another {name} account
          </Button>
        </div>
      )}
    </div>
  );
}
