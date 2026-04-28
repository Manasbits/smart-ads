"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthContext } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Loader2, CheckCircle2, Unplug, Zap } from "lucide-react";
import { toast } from "sonner";
import { builtInSkills } from "@/lib/skills/built-in/index";

interface AdAccount {
  id: string;
  name: string;
  currency: string;
}

interface MetaMetadata {
  metaUserId: string;
  adAccounts: AdAccount[];
  tokenExpiresAt?: { seconds: number };
}

interface ShopifyMetadata {
  shopDomain: string;
  shopName: string;
}

interface ConnectionInfo {
  provider: "meta_ads" | "shopify";
  name: string;
  isActive: boolean;
  metadata: MetaMetadata | ShopifyMetadata | null;
}

interface UserSkillItem {
  id: string;
  name: string;
  description: string;
  content: string;
}

export function ProfilePanel() {
  const { user } = useAuthContext();
  const initials =
    user?.displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold tracking-tight mb-6">Profile</h1>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback className="text-lg bg-muted">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium">{user?.displayName || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="text-xs">
                Google Account
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IntegrationsPanel() {
  const [connections, setConnections] = useState<ConnectionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null
  );
  const [disconnectingProvider, setDisconnectingProvider] = useState<
    string | null
  >(null);
  const [shopDomain, setShopDomain] = useState("");

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/connections", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setConnections(data.connections ?? []);
    } catch {
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleConnect = async (provider: "meta" | "shopify") => {
    if (provider === "shopify" && !shopDomain.trim()) {
      toast.error("Enter your Shopify store domain first");
      return;
    }

    setConnectingProvider(provider);
    try {
      const body: Record<string, string> = { provider, from: "/chat" };
      if (provider === "shopify") body.shopDomain = shopDomain.trim();

      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      setConnectingProvider(null);
    }
  };

  const handleDisconnect = async (provider: "meta_ads" | "shopify") => {
    setDisconnectingProvider(provider);
    try {
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
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
      setDisconnectingProvider(null);
    }
  };

  const metaConnection = connections.find((c) => c.provider === "meta_ads");
  const shopifyConnection = connections.find((c) => c.provider === "shopify");

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-lg font-semibold tracking-tight mb-6">
          Integrations
        </h1>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Connected Accounts</h3>
            <p className="text-xs text-muted-foreground">
              Connect your Meta Ads and Shopify accounts to use AI tools.
            </p>
          </div>
          <Separator />

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <MetaIntegrationCard
                connection={metaConnection ?? null}
                onConnect={() => handleConnect("meta")}
                onDisconnect={() => handleDisconnect("meta_ads")}
                connecting={connectingProvider === "meta"}
                disconnecting={disconnectingProvider === "meta_ads"}
              />
              <ShopifyIntegrationCard
                connection={shopifyConnection ?? null}
                shopDomain={shopDomain}
                onShopDomainChange={setShopDomain}
                onConnect={() => handleConnect("shopify")}
                onDisconnect={() => handleDisconnect("shopify")}
                connecting={connectingProvider === "shopify"}
                disconnecting={disconnectingProvider === "shopify"}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function SkillsPanel() {
  const [userSkills, setUserSkills] = useState<UserSkillItem[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [skillForm, setSkillForm] = useState({
    name: "",
    description: "",
    content: "",
  });
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [savingSkill, setSavingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [showSkillForm, setShowSkillForm] = useState(false);

  const fetchUserSkills = useCallback(async () => {
    setLoadingSkills(true);
    try {
      const res = await fetch("/api/skills", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setUserSkills(data.skills ?? []);
    } catch {
      toast.error("Failed to load skills");
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    fetchUserSkills();
  }, [fetchUserSkills]);

  const handleSaveSkill = async () => {
    if (
      !skillForm.name.trim() ||
      !skillForm.description.trim() ||
      !skillForm.content.trim()
    ) {
      toast.error("All fields are required");
      return;
    }
    setSavingSkill(true);
    try {
      const url = editingSkillId ? `/api/skills/${editingSkillId}` : "/api/skills";
      const method = editingSkillId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(skillForm),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save skill");
        return;
      }
      toast.success(editingSkillId ? "Skill updated" : "Skill created");
      setShowSkillForm(false);
      setEditingSkillId(null);
      setSkillForm({ name: "", description: "", content: "" });
      await fetchUserSkills();
    } catch {
      toast.error("Failed to save skill");
    } finally {
      setSavingSkill(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    setDeletingSkillId(skillId);
    try {
      const res = await fetch(`/api/skills/${skillId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Skill deleted");
      await fetchUserSkills();
    } catch {
      toast.error("Failed to delete skill");
    } finally {
      setDeletingSkillId(null);
    }
  };

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-lg font-semibold tracking-tight">Skills</h1>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Built-in Skills</h3>
            <p className="text-xs text-muted-foreground">
              These skills are always available to the AI.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            {builtInSkills.map((skill) => (
              <div
                key={skill.name}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                  <p className="text-sm font-medium font-mono">{skill.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{skill.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium mb-1">My Skills</h3>
              <p className="text-xs text-muted-foreground">
                Create custom skills to extend the AI&apos;s capabilities.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                setEditingSkillId(null);
                setSkillForm({ name: "", description: "", content: "" });
                setShowSkillForm(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New Skill
            </Button>
          </div>
          <Separator />

          {showSkillForm && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h4 className="text-sm font-medium">
                {editingSkillId ? "Edit Skill" : "New Skill"}
              </h4>
              <Input
                placeholder="skill-name (kebab-case)"
                value={skillForm.name}
                onChange={(e) =>
                  setSkillForm((f) => ({ ...f, name: e.target.value }))
                }
                disabled={!!editingSkillId}
                className="h-8 text-sm font-mono"
              />
              <Input
                placeholder="One-line description"
                value={skillForm.description}
                onChange={(e) =>
                  setSkillForm((f) => ({ ...f, description: e.target.value }))
                }
                className="h-8 text-sm"
              />
              <Textarea
                placeholder={"# Skill Instructions\n\nWrite full instructions..."}
                value={skillForm.content}
                onChange={(e) =>
                  setSkillForm((f) => ({ ...f, content: e.target.value }))
                }
                className="text-sm font-mono min-h-[160px] resize-y"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowSkillForm(false);
                    setEditingSkillId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveSkill} disabled={savingSkill}>
                  {savingSkill ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  {editingSkillId ? "Save Changes" : "Create Skill"}
                </Button>
              </div>
            </div>
          )}

          {loadingSkills ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : userSkills.length === 0 && !showSkillForm ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No custom skills yet.
            </p>
          ) : (
            <div className="space-y-2">
              {userSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium font-mono truncate">
                        {skill.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {skill.description}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setEditingSkillId(skill.id);
                          setSkillForm({
                            name: skill.name,
                            description: skill.description,
                            content: skill.content,
                          });
                          setShowSkillForm(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        disabled={deletingSkillId === skill.id}
                        onClick={() => handleDeleteSkill(skill.id)}
                      >
                        {deletingSkillId === skill.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Delete"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaIntegrationCard({
  connection,
  onConnect,
  onDisconnect,
  connecting,
  disconnecting,
}: {
  connection: ConnectionInfo | null;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
  disconnecting: boolean;
}) {
  const isActive = connection?.isActive ?? false;
  const meta = connection?.metadata as MetaMetadata | null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
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

      {isActive && meta && (
        <div className="pl-[52px] space-y-2">
          {meta.adAccounts?.length > 0 && (
            <div className="space-y-1">
              {meta.adAccounts.map((acc) => (
                <p key={acc.id} className="text-xs text-muted-foreground">
                  {acc.name}{" "}
                  <span className="font-mono text-muted-foreground/60">
                    {acc.id}
                  </span>
                </p>
              ))}
            </div>
          )}
          <DisconnectButton
            label="Meta Ads"
            onDisconnect={onDisconnect}
            disconnecting={disconnecting}
          />
        </div>
      )}
    </div>
  );
}

function ShopifyIntegrationCard({
  connection,
  shopDomain,
  onShopDomainChange,
  onConnect,
  onDisconnect,
  connecting,
  disconnecting,
}: {
  connection: ConnectionInfo | null;
  shopDomain: string;
  onShopDomainChange: (v: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  connecting: boolean;
  disconnecting: boolean;
}) {
  const isActive = connection?.isActive ?? false;
  const meta = connection?.metadata as ShopifyMetadata | null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
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

        {isActive ? (
          <Badge
            variant="secondary"
            className="text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        ) : null}
      </div>

      {isActive && meta ? (
        <div className="pl-[52px] space-y-2">
          <p className="text-xs text-muted-foreground">
            {meta.shopName}{" "}
            <span className="font-mono text-muted-foreground/60">
              {meta.shopDomain}
            </span>
          </p>
          <DisconnectButton
            label="Shopify"
            onDisconnect={onDisconnect}
            disconnecting={disconnecting}
          />
        </div>
      ) : (
        <div className="pl-[52px] flex gap-2">
          <Input
            placeholder="yourstore.myshopify.com"
            value={shopDomain}
            onChange={(e) => onShopDomainChange(e.target.value)}
            className="h-8 text-sm"
          />
          <Button
            onClick={onConnect}
            size="sm"
            variant="outline"
            className="gap-1.5 shrink-0"
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Connect
          </Button>
        </div>
      )}
    </div>
  );
}

function DisconnectButton({
  label,
  onDisconnect,
  disconnecting,
}: {
  label: string;
  onDisconnect: () => void;
  disconnecting: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-destructive hover:text-destructive gap-1 h-7 px-0"
            disabled={disconnecting}
          />
        }
      >
        {disconnecting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Unplug className="h-3 w-3" />
        )}
        Disconnect
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect {label}?</DialogTitle>
          <DialogDescription>
            This will revoke access to this {label} account. Active chats using
            this account will lose tool access.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <DialogClose
            render={<Button variant="destructive" />}
            onClick={onDisconnect}
          >
            Disconnect
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
