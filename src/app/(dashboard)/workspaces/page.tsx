"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Workspace } from "@/types";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIcon, setNewIcon] = useState("");

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch {
      toast.error("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim(),
          icon: newIcon || "📁",
        }),
      });
      if (res.ok) {
        toast.success("Workspace created");
        setDialogOpen(false);
        setNewName("");
        setNewDescription("");
        setNewIcon("");
        fetchWorkspaces();
      }
    } catch {
      toast.error("Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete workspace "${name}"? This can be undone later.`)) return;
    try {
      const res = await fetch(`/api/workspaces?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Workspace deleted");
        fetchWorkspaces();
      }
    } catch {
      toast.error("Failed to delete workspace");
    }
  };

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Workspaces
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Organize your clients and connected accounts
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., Client A"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Description{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </label>
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="e.g., Fashion brand, DTC"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Icon{" "}
                    <span className="text-muted-foreground font-normal">
                      (emoji)
                    </span>
                  </label>
                  <Input
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    placeholder="📁"
                    className="w-20"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create Workspace
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Separator className="mb-6" />

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No workspaces yet. Create one to organize your client accounts.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ws.icon || "📁"}</span>
                    <div>
                      <p className="font-medium text-sm">{ws.name}</p>
                      {ws.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ws.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(ws.id, ws.name)}
                    className="h-7 w-7 text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {ws.connectedAccounts?.length || 0} accounts
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
