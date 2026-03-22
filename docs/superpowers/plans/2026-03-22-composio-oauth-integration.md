# Composio OAuth Integration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace access-token-based Meta Ads/Shopify integration with proper OAuth flows via Composio SDK.

**Architecture:** New API routes handle OAuth initiation, connection status, sync, and disconnect. A callback page handles post-OAuth redirect. The Settings page gets real Connect/Disconnect buttons with live status. All changes are additive — existing chat flow is unchanged.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Composio SDK (`@composio/core` + `@composio/vercel`), Firebase Admin SDK (Firestore), shadcn/ui, Zustand, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-03-22-composio-oauth-integration-design.md`

**No test framework** is configured in this project. Verification is done via `pnpm build` (type checking) and manual dev server testing.

**Important:** AGENTS.md requires reading `node_modules/next/dist/docs/` before writing any Next.js code. Route handlers follow the pattern in `src/app/api/chat/route.ts` — export named HTTP method wrapped with `withAuth()`.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/app/api/integrations/connect/route.ts` | POST — initiate OAuth, return redirect URL |
| `src/app/api/integrations/connections/route.ts` | GET — list live connection statuses from Composio |
| `src/app/api/integrations/disconnect/route.ts` | POST — revoke a connected account |
| `src/app/api/integrations/sync-connection/route.ts` | POST — verify & persist connection after OAuth callback |
| `src/app/(auth)/auth/callback/page.tsx` | OAuth callback landing page with success/error UI |
| `src/lib/firestore/users.ts` | Already exists — add connected account CRUD helpers |

### Modified Files
| File | Change |
|------|--------|
| `src/lib/composio/client.ts` | Add `getSessionForUser()`, `disconnectAccount()`, refactor `getToolsForUser()` |
| `src/types/index.ts` | Add `UserConnectedAccount` type for Firestore-level connected accounts |
| `src/app/(dashboard)/settings/page.tsx` | Real OAuth buttons, live connection list, disconnect with confirmation |
| `src/lib/ai/system-prompt.ts` | Strengthen existing unconnected-account rule |
| `src/proxy.ts` | Add `/auth/callback` to PUBLIC_PATHS |

---

## Chunk 1: Backend Foundation

### Task 1: Update Composio Client

**Files:**
- Modify: `src/lib/composio/client.ts`

- [ ] **Step 1: Add `getSessionForUser()` export and `disconnectAccount()` helper**

Open `src/lib/composio/client.ts`. Refactor to extract session creation into `getSessionForUser()`, make `getToolsForUser()` use it, and add `disconnectAccount()`:

```typescript
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

/** Composio toolkit slugs (see https://docs.composio.dev/tools/metaads, /toolkits/shopify). */
const DEFAULT_SMARTADS_TOOLKITS = ["METAADS", "SHOPIFY"] as const;

let composioInstance: Composio<VercelProvider> | null = null;

function getComposio() {
  if (!composioInstance) {
    composioInstance = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new VercelProvider(),
    });
  }
  return composioInstance;
}

/**
 * Returns a full ToolRouterSession for the given user.
 * Use this when you need session.authorize() or session.toolkits().
 */
export async function getSessionForUser(userId: string) {
  if (!process.env.COMPOSIO_API_KEY?.trim()) {
    throw new Error("COMPOSIO_API_KEY is not configured");
  }
  const composio = getComposio();
  return composio.create(userId, {
    toolkits: [...DEFAULT_SMARTADS_TOOLKITS],
    manageConnections: true,
  });
}

export async function getToolsForUser(userId: string) {
  try {
    if (!process.env.COMPOSIO_API_KEY?.trim()) {
      console.warn("[composio] COMPOSIO_API_KEY is missing; tools disabled");
      return {};
    }

    const session = await getSessionForUser(userId);
    const tools = await session.tools();
    return tools;
  } catch (error) {
    console.error(
      "[composio] Failed to get tools:",
      JSON.stringify({ userId, error: String(error) })
    );
    // Graceful degradation — chat works without tools
    return {};
  }
}

/**
 * Disconnects a connected account from Composio.
 * Revokes tokens and removes the connection permanently.
 */
export async function disconnectAccount(connectedAccountId: string) {
  const composio = getComposio();
  await composio.connectedAccounts.delete(connectedAccountId);
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds — `getToolsForUser` behavior is identical, chat route is unaffected.

- [ ] **Step 3: Commit**

```bash
git add src/lib/composio/client.ts
git commit -m "feat: add getSessionForUser and disconnectAccount to Composio client"
```

---

### Task 2: Add Types and Firestore Helpers

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/firestore/users.ts`

- [ ] **Step 1: Add `UserConnectedAccount` type to `src/types/index.ts`**

Add after the existing `ConnectedAccount` interface (line 23). Note: use a generic type for `connectedAt` to avoid coupling to either the client or admin Timestamp SDK:

```typescript
/** Connected account stored on the user document (Firestore). */
export interface UserConnectedAccount {
  provider: "meta_ads" | "shopify";
  composioConnectionId: string;
  connectedAt: { seconds: number; nanoseconds: number };
}
```

- [ ] **Step 2: Add Firestore helpers to `src/lib/firestore/users.ts`**

Add these functions after the existing `updateUserSettings` function (line 41):

```typescript
import type { UserConnectedAccount } from "@/types";

export async function addConnectedAccount(
  userId: string,
  account: Omit<UserConnectedAccount, "connectedAt">
) {
  const doc = await usersRef().doc(userId).get();
  const existing = (doc.data()?.connectedAccounts ?? []) as UserConnectedAccount[];

  // Deduplicate — skip if same composioConnectionId already exists
  if (existing.some((a) => a.composioConnectionId === account.composioConnectionId)) {
    return;
  }

  const updated = [
    ...existing,
    { ...account, connectedAt: Timestamp.now() },
  ];
  await usersRef().doc(userId).update({ connectedAccounts: updated });
}

export async function removeConnectedAccount(
  userId: string,
  composioConnectionId: string
) {
  const doc = await usersRef().doc(userId).get();
  if (!doc.exists) return;

  const data = doc.data();
  const accounts = (data?.connectedAccounts ?? []) as UserConnectedAccount[];
  const updated = accounts.filter(
    (a) => a.composioConnectionId !== composioConnectionId
  );

  await usersRef().doc(userId).update({ connectedAccounts: updated });
}

export async function getConnectedAccounts(
  userId: string
): Promise<UserConnectedAccount[]> {
  const doc = await usersRef().doc(userId).get();
  if (!doc.exists) return [];
  return (doc.data()?.connectedAccounts ?? []) as UserConnectedAccount[];
}
```

Note: No new imports needed — the existing file already has `import { Timestamp } from "firebase-admin/firestore"`. The `UserConnectedAccount` type uses a generic `{ seconds: number; nanoseconds: number }` for `connectedAt` to avoid client/admin Timestamp type mismatch — at runtime, the admin `Timestamp.now()` satisfies this shape.

- [ ] **Step 3: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/lib/firestore/users.ts
git commit -m "feat: add UserConnectedAccount type and Firestore CRUD helpers"
```

---

### Task 3: Create Connect API Route

**Files:**
- Create: `src/app/api/integrations/connect/route.ts`

- [ ] **Step 1: Create the route file**

Follow the pattern from `src/app/api/integrations/status/route.ts` and `src/app/api/chat/route.ts`.

```typescript
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getSessionForUser } from "@/lib/composio/client";

const VALID_TOOLKITS = ["METAADS", "SHOPIFY"] as const;
type ValidToolkit = (typeof VALID_TOOLKITS)[number];

function isValidToolkit(value: unknown): value is ValidToolkit {
  return typeof value === "string" && VALID_TOOLKITS.includes(value as ValidToolkit);
}

function isValidFromPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  // Must start with / but not // (prevent open redirect)
  return value.startsWith("/") && !value.startsWith("//");
}

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { toolkit, from } = body;

    if (!isValidToolkit(toolkit)) {
      return NextResponse.json(
        { error: "Invalid toolkit. Must be METAADS or SHOPIFY." },
        { status: 400 }
      );
    }

    const safeTo = isValidFromPath(from) ? from : "/settings";

    const session = await getSessionForUser(userId);

    const appOrigin = new URL(req.url).origin;
    const callbackUrl = `${appOrigin}/auth/callback?toolkit=${toolkit}&from=${encodeURIComponent(safeTo)}`;

    const connectionRequest = await session.authorize(toolkit, { callbackUrl });

    if (!connectionRequest.redirectUrl) {
      console.error("[connect] No redirectUrl returned from Composio", {
        userId,
        toolkit,
      });
      return NextResponse.json(
        { error: "Failed to initiate OAuth flow. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ redirectUrl: connectionRequest.redirectUrl });
  } catch (error) {
    console.error("[connect] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate connection" },
      { status: 500 }
    );
  }
});
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/integrations/connect/route.ts
git commit -m "feat: add POST /api/integrations/connect for OAuth initiation"
```

---

### Task 4: Create Connections API Route

**Files:**
- Create: `src/app/api/integrations/connections/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getSessionForUser } from "@/lib/composio/client";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, { userId }) => {
  try {
    const session = await getSessionForUser(userId);
    const result = await session.toolkits();

    const connections = result.items.map((item) => ({
      name: item.name,
      slug: item.slug,
      isActive: item.connection?.isActive ?? false,
      logo: item.logo,
      connectedAccount: item.connection?.connectedAccount
        ? {
            id: item.connection.connectedAccount.id,
            status: item.connection.connectedAccount.status,
          }
        : undefined,
    }));

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("[connections] Error:", error);

    // If Composio is down or not configured, return empty gracefully
    if (
      error instanceof Error &&
      error.message.includes("COMPOSIO_API_KEY")
    ) {
      return NextResponse.json({ connections: [], configured: false });
    }

    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
});
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/integrations/connections/route.ts
git commit -m "feat: add GET /api/integrations/connections for live status"
```

---

### Task 5: Create Sync-Connection API Route

**Files:**
- Create: `src/app/api/integrations/sync-connection/route.ts`

- [ ] **Step 1: Create the route file**

This route is called by the callback page after OAuth completes. It checks Composio for the active connection and persists it to Firestore.

```typescript
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { getSessionForUser } from "@/lib/composio/client";
import { addConnectedAccount } from "@/lib/firestore/users";

const TOOLKIT_TO_PROVIDER: Record<string, "meta_ads" | "shopify"> = {
  METAADS: "meta_ads",
  SHOPIFY: "shopify",
};

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { toolkit } = body;

    if (!toolkit || !TOOLKIT_TO_PROVIDER[toolkit]) {
      return NextResponse.json(
        { error: "Invalid toolkit" },
        { status: 400 }
      );
    }

    const session = await getSessionForUser(userId);
    const result = await session.toolkits();

    const match = result.items.find((item) => item.slug === toolkit);

    if (
      match?.connection?.isActive &&
      match.connection.connectedAccount?.id
    ) {
      await addConnectedAccount(userId, {
        provider: TOOLKIT_TO_PROVIDER[toolkit],
        composioConnectionId: match.connection.connectedAccount.id,
      });

      return NextResponse.json({
        success: true,
        connectedAccountId: match.connection.connectedAccount.id,
      });
    }

    return NextResponse.json({ success: false });
  } catch (error) {
    console.error("[sync-connection] Error:", error);
    return NextResponse.json(
      { error: "Failed to sync connection" },
      { status: 500 }
    );
  }
});
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/integrations/sync-connection/route.ts
git commit -m "feat: add POST /api/integrations/sync-connection for callback persistence"
```

---

### Task 6: Create Disconnect API Route

**Files:**
- Create: `src/app/api/integrations/disconnect/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { disconnectAccount } from "@/lib/composio/client";
import { removeConnectedAccount } from "@/lib/firestore/users";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const { connectedAccountId } = body;

    if (!connectedAccountId || typeof connectedAccountId !== "string") {
      return NextResponse.json(
        { error: "connectedAccountId is required" },
        { status: 400 }
      );
    }

    // Disconnect from Composio (revokes tokens)
    await disconnectAccount(connectedAccountId);

    // Remove from Firestore
    await removeConnectedAccount(userId, connectedAccountId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[disconnect] Error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect account" },
      { status: 500 }
    );
  }
});
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/integrations/disconnect/route.ts
git commit -m "feat: add POST /api/integrations/disconnect for account removal"
```

---

## Chunk 2: Frontend — Callback Page & Settings

### Task 7: Create OAuth Callback Page

**Files:**
- Create: `src/app/(auth)/auth/callback/page.tsx`

- [ ] **Step 1: Create the callback page**

This page lives in the `(auth)` route group (same as login). It reads query params, calls the sync-connection API, and shows success/error UI.

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOOLKIT_LABELS: Record<string, string> = {
  METAADS: "Meta Ads",
  SHOPIFY: "Shopify",
};

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"syncing" | "success" | "error">(
    "syncing"
  );

  const toolkit = searchParams.get("toolkit") || "";
  const from = searchParams.get("from") || "/settings";
  const label = TOOLKIT_LABELS[toolkit] || toolkit;

  useEffect(() => {
    if (!toolkit) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/integrations/sync-connection", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolkit }),
        });

        if (cancelled) return;

        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setTimeout(() => {
            if (!cancelled) router.push(from);
          }, 2000);
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toolkit, from, router]);

  const handleRetry = async () => {
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit, from }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch {
      // Stay on error state
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-sm w-full text-center space-y-4 px-4">
        {status === "syncing" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-lg font-semibold">Connecting {label}...</h1>
            <p className="text-sm text-muted-foreground">
              Verifying your connection
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h1 className="text-lg font-semibold">
              {label} connected successfully!
            </h1>
            <p className="text-sm text-muted-foreground">
              Redirecting you back...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-lg font-semibold">Connection failed</h1>
            <p className="text-sm text-muted-foreground">
              Could not connect {label}. The OAuth flow may have been cancelled
              or timed out.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => router.push(from)}>
                Go back
              </Button>
              <Button onClick={handleRetry}>Try again</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)/auth/callback/page.tsx"
git commit -m "feat: add OAuth callback page with sync and redirect"
```

---

### Task 8: Update Settings Page

**Files:**
- Modify: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Rewrite the Settings page with live connections and OAuth buttons**

Replace the entire file. The new version:
- Fetches `GET /api/integrations/connections` on mount for live status
- Falls back to `GET /api/integrations/status` for API key check
- Shows connected accounts with "Disconnect" button (confirmation dialog)
- Shows "Connect" button that redirects to OAuth
- Supports multiple accounts per provider

```typescript
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
      // Fall back to status endpoint
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

  // Note: session.toolkits() returns one item per toolkit slug.
  // Multi-account per provider depends on Composio SDK supporting multiple
  // connections per toolkit. The "Connect another" button will initiate a new
  // OAuth flow — Composio may replace or add the connection depending on SDK version.
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
                  {/* Meta Ads */}
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

                  {/* Shopify */}
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

/* ------------------------------------------------------------------ */
/* Integration Card Component                                          */
/* ------------------------------------------------------------------ */

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
            {/* DialogContent already renders DialogPortal + DialogOverlay internally */}
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
```

**Important Base UI notes:**
- This project uses `@base-ui/react` (NOT Radix UI). Components use `render` prop instead of `asChild`.
- `DialogContent` already renders `DialogPortal` + `DialogOverlay` internally — do NOT wrap it with those again.
- `DialogTrigger` and `DialogClose` use `render={<Button ... />}` to render as custom elements.

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds. If Dialog import names differ, adjust to match the actual exports.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(dashboard)/settings/page.tsx"
git commit -m "feat: update settings page with OAuth connect/disconnect UI"
```

---

## Chunk 3: System Prompt, Proxy & Final Verification

### Task 9: Add `/auth/callback` to Proxy Public Paths

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Add `/auth/callback` to PUBLIC_PATHS**

In `src/proxy.ts`, update the `PUBLIC_PATHS` array (line 3):

```typescript
// Old:
const PUBLIC_PATHS = ["/login", "/api/auth"];

// New:
const PUBLIC_PATHS = ["/login", "/api/auth", "/auth/callback"];
```

This ensures the callback page is accessible even if the session cookie has expired during a lengthy OAuth redirect. The sync-connection API called by the callback page still requires authentication via `withAuth`, so security is maintained.

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/proxy.ts
git commit -m "feat: add /auth/callback to proxy public paths for OAuth flow"
```

---

### Task 10: Update System Prompt

**Files:**
- Modify: `src/lib/ai/system-prompt.ts`

- [ ] **Step 1: Strengthen the unconnected-account rule**

In `src/lib/ai/system-prompt.ts`, replace the existing rule at line 45-47:

```typescript
// Old:
  parts.push(
    `- If the user asks about an account that isn't connected, suggest they connect it in Settings.`
  );

// New:
  parts.push(
    `- If the user asks about Meta Ads or Shopify data but the relevant account is not connected, do NOT attempt to use tools. Instead, respond: "You'll need to connect your [Provider] account first. Go to [Settings](/settings?tab=integrations) to connect it."`
  );
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai/system-prompt.ts
git commit -m "feat: strengthen system prompt rule for unconnected accounts"
```

---

### Task 11: Full Build Verification & Manual Testing

- [ ] **Step 1: Run full build**

Run: `pnpm build`
Expected: Build succeeds with zero errors and zero type errors.

- [ ] **Step 2: Manual testing checklist (dev server)**

Start: `pnpm dev`

Test each flow:

1. **Settings page loads** — Navigate to `/settings`, click "Integrations" tab. Verify connection cards render with "Connect" buttons.
2. **Connect Meta Ads** — Click "Connect" on Meta Ads card. Verify redirect to Composio OAuth page. Complete OAuth. Verify callback page shows success and redirects to Settings. Verify Meta Ads now shows "Connected" badge.
3. **Connect Shopify** — Same flow as Meta Ads.
4. **Disconnect** — Click "Disconnect" on a connected account. Verify confirmation dialog appears. Click "Disconnect" in dialog. Verify account is removed and card reverts to "Connect" state.
5. **Chat still works** — Navigate to `/chat`. Send a message. Verify AI responds and tools work if accounts are connected.
6. **Callback error** — Navigate directly to `/auth/callback?toolkit=METAADS`. Verify error state shows (no recent OAuth = sync fails). Verify "Try again" and "Go back" buttons work.
7. **No API key** — Temporarily remove `COMPOSIO_API_KEY` from `.env.local`. Verify Settings shows warning banner and Connect buttons show error toast.

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
