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
- Connected accounts stored at user level (not workspace-scoped)
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
| `GET /api/integrations/status` | Extended with connection data |

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
2. Create a Composio session for `userId` via `getSessionForUser(userId)`
3. Build callback URL: `${APP_ORIGIN}/auth/callback?toolkit=${toolkit}&from=${from}`
4. Call `session.authorize(toolkit, { callbackUrl })`
5. Return `{ redirectUrl }` from the ConnectionRequest

**Response:**
```typescript
{ redirectUrl: string }
```

**Errors:**
- 400: invalid toolkit
- 500: Composio SDK failure (log and return generic message)

---

### GET /api/integrations/connections

Returns real-time connection status for all supported toolkits.

**Auth:** `withAuth`

**Logic:**
1. Create a Composio session for `userId`
2. Call `session.toolkits()` to get live connection status for METAADS and SHOPIFY
3. Return the connection data

**Response:**
```typescript
{
  connections: Array<{
    name: string;           // "Meta Ads" or "Shopify"
    slug: string;           // "METAADS" or "SHOPIFY"
    isActive: boolean;
    logo?: string;
    connectedAccount?: {
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
1. Delete the connected account via Composio SDK (`composio.connectedAccounts.delete(connectedAccountId)`)
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

The `getComposio()` singleton also needs to be exported for the disconnect route, which needs direct access to `composio.connectedAccounts`.

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

**URL pattern:** `/auth/callback?toolkit=METAADS&from=/settings&status=success`

**Behavior:**
1. On mount, read query params: `toolkit`, `from`, `status`
2. If status indicates success:
   - Show success UI: checkmark animation + "Meta Ads connected successfully!"
   - Call `POST /api/integrations/save-connection` to persist to Firestore (or handle this server-side in the connect flow)
   - After 2 seconds, redirect to `from` path (default `/settings`)
3. If status indicates failure or error:
   - Show error UI: "Connection failed" message
   - "Try again" button that calls `POST /api/integrations/connect` again
   - "Go back" link to `from` path

**Note:** This page is in the `(auth)` group so it doesn't require the dashboard layout. It should be added to the middleware's public paths since the user may not have a full session during the OAuth redirect flow.

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

Add to `src/lib/ai/system-prompt.ts`:

```
If the user asks about Meta Ads or Shopify data but the relevant account is not connected,
do NOT attempt to use tools. Instead, respond with:
"You'll need to connect your [Provider] account first.
Go to [Settings](/settings?tab=integrations) to connect it."
```

This replaces the current behavior where Composio's `manageConnections` would show an inline OAuth prompt. The `manageConnections: true` setting is kept as a silent fallback but the system prompt instruction takes priority.

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
| `src/app/(auth)/auth/callback/page.tsx` | OAuth callback landing page |

## Modified Files Summary

| File | Change |
|------|--------|
| `src/lib/composio/client.ts` | Add `getSessionForUser()`, export `getComposio()` |
| `src/app/(dashboard)/settings/page.tsx` | Real OAuth buttons, connection list, disconnect |
| `src/lib/ai/system-prompt.ts` | Add instruction for unconnected account handling |
| `src/proxy.ts` | Add `/auth/callback` to public paths |
| `src/lib/firestore/users.ts` | Add connected account CRUD helpers |
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
