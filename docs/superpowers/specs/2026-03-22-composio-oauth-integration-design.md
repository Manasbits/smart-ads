# Composio OAuth Integration — Design Specification

**Date:** 2026-03-22
**Status:** Draft
**Approach:** Composio SDK-Only (session.authorize + session.toolkits)

---

## Overview

Replace the current "trigger tools in chat to connect" approach with proper OAuth flows for Meta Ads and Shopify via Composio. Users connect accounts from the Settings page (primary) or get directed there from chat (secondary). Composio handles the entire OAuth lifecycle — redirect, token exchange, storage, and refresh.

**Key decisions:**
- OAuth triggered from Settings page; chat nudges users to Settings when unconnected
- Multiple accounts per provider supported (agency use case)
- Connected accounts stored at user level (not workspace-scoped — deviates from main spec which puts them on workspaces; user-level is simpler for MVP and workspace scoping can be layered on later)
- Dedicated `/auth/callback` page handles post-OAuth redirect
- Disconnect requires confirmation dialog
- Full backward compatibility — existing chat flow unchanged

---

## Backward Compatibility Guarantees

All changes are additive. Nothing in the existing codebase breaks.

| Existing code | Impact |
|---------------|--------|
| `getToolsForUser(userId)` | Unchanged — same signature, same behavior |
| `POST /api/chat` route | Zero modifications |
| `manageConnections: true` | Kept as fallback for in-chat prompts |
| Firestore conversations/messages/memories | Untouched |
| Settings page | Extended, not replaced |
| `GET /api/integrations/status` | Unchanged — still returns `composioApiKeyConfigured` only |

---

## New API Routes

### POST /api/integrations/connect

Initiates an OAuth flow for a given toolkit.

**Auth:** `withAuth` (Firebase session cookie)

**Request body:**
```typescript
{
  toolkit: "METAADS" | "SHOPIFY";
  from?: string; // origin path for post-OAuth redirect, defaults to "/settings"
}
```

**Logic:**
1. Validate `toolkit` is one of `METAADS` or `SHOPIFY`
2. Validate `from` is a relative path starting with `/` (not `//`) to prevent open redirect attacks. Default to `"/settings"` if missing or invalid.
3. Create a Composio session for `userId` via `getSessionForUser(userId)`
4. Build callback URL: `${appOrigin}/auth/callback?toolkit=${toolkit}&from=${from}` where `appOrigin` is derived from the request's `Host` header via `new URL(req.url).origin` (works in both local dev and Vercel production — no new env var needed)
5. Call `session.authorize(toolkit, { callbackUrl })`
6. The `ConnectionRequest` returned has `redirectUrl: string | null | undefined`. If `redirectUrl` is falsy, return a 500 error — both METAADS and SHOPIFY use OAuth2 which always provides a redirect URL, so a missing one indicates an SDK or configuration error.
7. Return `{ redirectUrl }` to the client

**Response:**
```typescript
{ redirectUrl: string }
```

**Errors:**
- 400: invalid toolkit or invalid `from` path
- 500: Composio SDK failure or missing redirect URL (log and return generic message)

---

### GET /api/integrations/connections

Returns real-time connection status for all supported toolkits.

**Auth:** `withAuth`

**Logic:**
1. Create a Composio session for `userId`
2. Call `session.toolkits()` to get live connection status for METAADS and SHOPIFY
3. Map the SDK response to our API shape. The SDK returns:
   ```typescript
   { items: [{ name, slug, isNoAuth, logo?, connection?: { isActive, authConfig?, connectedAccount?: { id, status } } }], nextCursor, totalPages }
   ```
   We flatten `connection.isActive` → `isActive` and `connection.connectedAccount` → `connectedAccount` for a simpler client-side contract.
4. Pagination: The SDK supports `nextCursor`/`totalPages` but with only 2 toolkits (METAADS, SHOPIFY) pagination is unnecessary. No cursor handling for now.

**Response:**
```typescript
{
  connections: Array<{
    name: string;           // "Meta Ads" or "Shopify"
    slug: string;           // "METAADS" or "SHOPIFY"
    isActive: boolean;      // mapped from items[].connection?.isActive ?? false
    logo?: string;
    connectedAccount?: {    // mapped from items[].connection?.connectedAccount
      id: string;           // composio connected account ID
      status: string;
    };
  }>;
}
```

---

### POST /api/integrations/disconnect

Disconnects a connected account.

**Auth:** `withAuth`

**Request body:**
```typescript
{
  connectedAccountId: string;
  toolkit: string;          // "METAADS" | "SHOPIFY" for Firestore cleanup
}
```

**Logic:**
1. Delete the connected account via `disconnectAccount(connectedAccountId)` from `src/lib/composio/client.ts`
2. Remove the matching entry from `users/{userId}.connectedAccounts` in Firestore
3. Return success

**Response:**
```typescript
{ success: boolean }
```

**Errors:**
- 400: missing connectedAccountId
- 500: Composio or Firestore failure

---

## Composio Client Changes

**File:** `src/lib/composio/client.ts`

Add a new export `getSessionForUser(userId)` that returns the full `ToolRouterSession` object. This allows API routes to call `session.authorize()` and `session.toolkits()`.

```typescript
export async function getSessionForUser(userId: string) {
  const composio = getComposio();
  const session = await composio.create(userId, {
    toolkits: [...DEFAULT_SMARTADS_TOOLKITS],
    manageConnections: true,
  });
  return session;
}
```

The existing `getToolsForUser(userId)` function calls `getSessionForUser` internally and returns `session.tools()` — same result, refactored to share the session creation logic.

Add a `disconnectAccount(connectedAccountId: string)` helper that encapsulates the Composio disconnect call. This avoids exposing the raw Composio client to consuming code:

```typescript
export async function disconnectAccount(connectedAccountId: string) {
  const composio = getComposio();
  await composio.connectedAccounts.delete({ id: connectedAccountId });
}
```

---

## Firestore Data Changes

### users/{userId} — new field

Add `connectedAccounts` array (additive, does not affect existing fields):

```typescript
connectedAccounts?: Array<{
  provider: "meta_ads" | "shopify";
  composioConnectionId: string;
  connectedAt: Timestamp;
}>
```

This field is updated:
- **On callback:** When user returns from OAuth, the callback page calls an API to save the connection
- **On disconnect:** Entry removed from the array

### Firestore helper functions

Add to `src/lib/firestore/users.ts` (or create if it doesn't exist):

- `addConnectedAccount(userId, account)` — appends to the connectedAccounts array
- `removeConnectedAccount(userId, composioConnectionId)` — removes the matching entry
- `getConnectedAccounts(userId)` — returns the array (or empty)

---

## Callback Page

**Route:** `src/app/(auth)/auth/callback/page.tsx`

**URL pattern:** `/auth/callback?toolkit=METAADS&from=/settings`

### Persistence Flow

After OAuth completes, Composio redirects the user back to our callback URL. At this point, Composio has already stored the OAuth tokens internally. We need to:

1. Verify the connection is now active by calling `GET /api/integrations/connections`
2. If the connection for the given `toolkit` is active, save it to Firestore

The callback page does this via a new API route:

**`POST /api/integrations/sync-connection`** (new route, added to New Files Summary)

**Request body:**
```typescript
{ toolkit: "METAADS" | "SHOPIFY" }
```

**Logic:**
1. Create a Composio session for `userId`, call `session.toolkits()`
2. Find the entry matching the given `toolkit`
3. If `connection.isActive` and `connection.connectedAccount.id` exists:
   - Save to `users/{userId}.connectedAccounts` via `addConnectedAccount()`
   - Return `{ success: true, connectedAccountId }`
4. If not active: return `{ success: false }` (OAuth may have failed or been cancelled)

### Page Behavior

1. On mount, read query params: `toolkit`, `from`
2. Immediately call `POST /api/integrations/sync-connection` with `{ toolkit }`
3. If sync succeeds:
   - Show success UI: checkmark animation + "[Provider] connected successfully!"
   - After 2 seconds, redirect to `from` path (default `/settings`)
4. If sync fails or returns `{ success: false }`:
   - Show error UI: "Connection failed" message
   - "Try again" button that calls `POST /api/integrations/connect` again
   - "Go back" link to `from` path

### Route Protection

This page is in the `(auth)` group so it doesn't require the dashboard layout. The user will always have a valid session cookie when reaching this page (they authenticated before clicking "Connect"), so no changes to `proxy.ts` PUBLIC_PATHS are needed. The session cookie persists across the OAuth redirect.

---

## Settings Page Updates

**File:** `src/app/(dashboard)/settings/page.tsx`

### Changes:

1. **On mount:** Fetch `GET /api/integrations/connections` instead of just `/api/integrations/status`
2. **Connection cards:** For each toolkit (METAADS, SHOPIFY):
   - If active connection(s) exist: show green "Connected" badge, account ID, "Disconnect" button
   - If no connection: show "Connect" button
3. **Connect button handler:**
   - Call `POST /api/integrations/connect` with toolkit
   - Receive `redirectUrl`
   - `window.location.href = redirectUrl` (full page redirect to OAuth provider)
4. **Disconnect button handler:**
   - Show confirmation dialog: "This will disconnect [Provider]. Any active chats using this account will lose tool access. Continue?"
   - On confirm: call `POST /api/integrations/disconnect`
   - On success: refresh connection list
5. **Multiple accounts:** Each provider section lists all connected accounts with individual disconnect buttons, plus an "Add another" button

### UI layout:

```
┌─────────────────────────────────────────────┐
│ Meta Ads                                     │
│ Manage campaigns, view insights              │
│                                              │
│  ✓ Connected (act_123456789)    [Disconnect] │
│  ✓ Connected (act_987654321)    [Disconnect] │
│                                              │
│  [+ Connect another Meta Ads account]        │
├─────────────────────────────────────────────┤
│ Shopify                                      │
│ Track orders, products, analytics            │
│                                              │
│  No accounts connected                       │
│                                              │
│  [Connect Shopify]                           │
└─────────────────────────────────────────────┘
```

---

## Chat Integration

### System Prompt Update

The existing system prompt in `src/lib/ai/system-prompt.ts` already has a rule at line 46: "If the user asks about an account that isn't connected, suggest they connect it in Settings." Update this rule to be more explicit:

```
If the user asks about Meta Ads or Shopify data but the relevant account is not connected,
do NOT attempt to use tools. Instead, respond with:
"You'll need to connect your [Provider] account first.
Go to [Settings](/settings?tab=integrations) to connect it."
```

This strengthens the existing rule by adding the "do NOT attempt to use tools" directive and providing the specific Settings URL with the integrations tab. The `manageConnections: true` setting is kept as a silent fallback.

### No changes to chat route

The `POST /api/chat` route is completely unchanged. `getToolsForUser()` continues to work identically.

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Composio API key missing | Settings shows warning banner (existing behavior preserved) |
| OAuth redirect fails | Callback page shows error + "Try again" button |
| Token expired/revoked | `session.toolkits()` returns `isActive: false`; Settings shows as disconnected |
| Disconnect API fails | Toast error, connection list stays unchanged |
| Multiple concurrent connects | Each creates independent Composio connections; no conflict |

---

## New Files Summary

| File | Purpose |
|------|---------|
| `src/app/api/integrations/connect/route.ts` | POST — initiate OAuth |
| `src/app/api/integrations/connections/route.ts` | GET — list connection statuses |
| `src/app/api/integrations/disconnect/route.ts` | POST — revoke connection |
| `src/app/api/integrations/sync-connection/route.ts` | POST — verify & persist connection after OAuth callback |
| `src/app/(auth)/auth/callback/page.tsx` | OAuth callback landing page |
| `src/lib/firestore/users.ts` | Firestore helpers for connected account CRUD |

## Modified Files Summary

| File | Change |
|------|--------|
| `src/lib/composio/client.ts` | Add `getSessionForUser()`, `disconnectAccount()` |
| `src/app/(dashboard)/settings/page.tsx` | Real OAuth buttons, connection list, disconnect |
| `src/lib/ai/system-prompt.ts` | Strengthen existing unconnected-account rule |
| `src/types/index.ts` | Add/update ConnectedAccount type if needed |

---

## Environment Variables

No new environment variables required. The existing `COMPOSIO_API_KEY` is sufficient since we're using Composio's default OAuth apps.

Future upgrade path: Add `COMPOSIO_METAADS_AUTH_CONFIG_ID` and `COMPOSIO_SHOPIFY_AUTH_CONFIG_ID` when switching to custom OAuth apps (Approach C from brainstorming).

---

## Out of Scope

- Workspace-scoped account binding (future enhancement)
- Custom OAuth app registration with Meta/Shopify
- Token refresh monitoring UI
- Account usage analytics
- Rate limiting on connect/disconnect endpoints
