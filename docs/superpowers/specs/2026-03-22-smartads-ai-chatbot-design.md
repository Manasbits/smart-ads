# SmartAds AI Chatbot — Design Specification

**Date:** 2026-03-22
**Status:** Draft
**Author:** Brainstorming session

---

## Overview

SmartAds is a SaaS AI chatbot that gives brand owners and e-commerce marketing agencies a conversational interface to their Meta Ads accounts and Shopify stores. Users connect accounts, ask questions, and get insights — all through natural language powered by Claude via OpenRouter (model configurable via env vars).

**Target users:** Brand owners and e-commerce marketing agencies managing multiple Meta Ads accounts and Shopify stores.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Firebase Auth (Google Sign-In only) |
| Database | Google Firestore |
| AI | Vercel AI SDK (`ai` + `@ai-sdk/openai` → OpenRouter) |
| LLM | Claude Sonnet 4 (configurable via `LLM_MODEL` env var) via OpenRouter |
| Tools/MCP | `@composio/core` + `@composio/vercel` (Meta Ads & Shopify) |
| Deployment | Vercel (Fluid Compute on chat route) |
| Package Manager | pnpm |

---

## Architecture

**Approach:** Monolithic Next.js — single app handles UI, API routes, auth, chat, and Composio integration. Deployed as one Vercel project.

```
Next.js App (Vercel)
├── App Router (pages + layouts)
├── API Routes
│   ├── /api/chat → streamText + Composio tools (Fluid Compute)
│   ├── /api/auth → Firebase Admin SDK verification
│   └── /api/accounts → Composio connected accounts
├── Firebase Auth (client-side Google Sign-In)
├── Firestore (conversations, memory, user data)
└── Composio SDK (per-user sessions)
```

**Vercel Fluid Compute** is enabled on the `/api/chat` route to handle long-running agent tasks (2-5 minutes) without timeout. If compute costs become prohibitive, the chat API route can be extracted to Fly.io serverless with minimal refactoring since it's already isolated.

---

## Project Structure

```
smartAds/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── chat/
│   │   │   │   └── [[...id]]/page.tsx
│   │   │   ├── workspaces/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── chat/route.ts
│   │   │   └── auth/route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── chat/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts
│   │   │   └── admin.ts
│   │   ├── composio/
│   │   │   └── client.ts
│   │   ├── ai/
│   │   │   └── provider.ts
│   │   └── memory/
│   │       └── manager.ts
│   ├── hooks/
│   ├── types/
│   └── stores/
├── public/
├── .env.local
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Authentication & Route Protection

### Two-Layer Auth

**Layer 1 — Middleware (edge):**
- Runs on every request
- Public routes: `/login`, `/api/auth`
- All other routes: check Firebase session cookie presence
- Missing/invalid cookie → redirect to `/login`
- No Firebase Admin SDK call here (not edge-compatible) — cookie presence check only

**Layer 2 — API route guard:**
- `withAuth(handler)` wrapper for every API route
- Calls `verifyIdToken()` via Firebase Admin SDK
- Extracts `userId` from verified token
- Returns 401 if token is invalid
- `userId` is never taken from request body/params — always from the verified token

```typescript
export const POST = withAuth(async (req, { userId }) => {
  // userId is guaranteed verified here
});
```

### Session Cookie Specification

- Firebase session cookie created via `admin.auth().createSessionCookie(idToken, { expiresIn })`
- Expiration: 14 days (Firebase maximum)
- Attributes: `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, `path: '/'`
- Sign-out: clear cookie on client + call `admin.auth().revokeRefreshTokens(userId)` server-side
- `sameSite: 'lax'` provides CSRF protection — POST requests from other origins won't include the cookie

### Middleware Clarification

Middleware checks cookie **presence only** — it is a UX optimization for page navigation, not a security boundary. API routes perform full `verifySessionCookie()` verification on every request. This means a request with an expired cookie will pass middleware but get rejected at the API route level.

### Auth Flow

1. User visits app → middleware checks cookie → no cookie → redirect to `/login`
2. `/login` page → Firebase client SDK Google Sign-In → get ID token
3. POST to `/api/auth` with ID token → Admin SDK verifies → create session cookie with attributes above
4. Redirect to `/chat`
5. Sign-out: POST `/api/auth/signout` → revoke refresh tokens + clear cookie → redirect to `/login`

---

## Data Model (Firestore)

### users/{userId}
| Field | Type | Description |
|-------|------|-------------|
| email | string | Google account email |
| displayName | string | From Google profile |
| photoURL | string | Profile photo |
| createdAt | timestamp | Account creation |
| lastLoginAt | timestamp | Last login |
| defaultWorkspaceId | string? | Optional default workspace |
| settings | map | Theme, preferences |

### workspaces/{workspaceId}
| Field | Type | Description |
|-------|------|-------------|
| ownerId | string | userId of owner |
| name | string | Workspace name |
| description | string | Optional description |
| icon | string | Emoji or icon |
| createdAt | timestamp | Creation time |
| connectedAccounts | array | List of connected accounts |

Each connected account:
```
{ provider: "meta_ads" | "shopify", accountId, accountName, composioConnectionId }
```

### conversations/{conversationId}
| Field | Type | Description |
|-------|------|-------------|
| userId | string | Owner |
| workspaceId | string? | null = global chat |
| title | string | Auto-generated from first message |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last activity |
| status | string | "active" / "archived" |
| activeAccountContext | map | { metaAdsAccountId?, shopifyStoreId? } |

### conversations/{conversationId}/messages/{messageId}
| Field | Type | Description |
|-------|------|-------------|
| role | string | "user" / "assistant" / "tool" |
| content | string | Message text |
| toolInvocations | array | Tool call details |
| createdAt | timestamp | Send time |
| tokenUsage | map | { prompt, completion } |

### memory/{memoryId}
| Field | Type | Description |
|-------|------|-------------|
| userId | string | Owner |
| scope | string | "global" / "account" |
| scopeId | string? | Meta Ads account ID or Shopify store ID |
| workspaceId | string? | Workspace association |
| category | string | "business_context" / "preference" / "insight" |
| content | string | The memory text |
| source | map | { conversationId, messageId } |
| createdAt | timestamp | Creation time |
| updatedAt | timestamp | Last update |
| embedding | array? | Future: vector for RAG |

### Pagination Strategy
- **Conversations list (sidebar):** cursor-based pagination using `updatedAt` descending, 20 per page, load more on scroll.
- **Messages (chat):** load latest 50 messages on conversation open, scroll-up to load older batches of 50. Firestore `orderBy('createdAt', 'desc').limit(50)` with `startAfter` cursor.

### Required Firestore Composite Indexes
- `conversations`: `userId` ASC + `updatedAt` DESC
- `conversations`: `userId` ASC + `workspaceId` ASC + `updatedAt` DESC
- `memory`: `userId` ASC + `scopeId` ASC + `category` ASC

**Key design decisions:**
- Memory isolation via `scope` + `scopeId` — no cross-account leakage
- Messages as subcollection for Firestore performance at scale
- `activeAccountContext` on conversation tracks which accounts the user has selected
- Connected accounts live on workspaces; global chat aggregates from all workspaces

---

## AI Chat & Composio Integration

### Chat Flow

```
Client (useChat hook)
  → POST /api/chat { messages, workspaceId?, activeAccounts }
  → withAuth extracts userId
  → Load relevant memory from Firestore (scoped by activeAccounts)
  → Create Composio session: composio.create(userId)
  → Get tools: session.tools()
  → Build system prompt (with memory + account context)
  → streamText({
       model: openrouter(process.env.LLM_MODEL),
       tools,
       messages,
       system: systemPrompt,
       maxSteps: 15,
       onStepFinish: stream tool status events to client
     })
  → On stream finish: save messages to Firestore
  → On stream finish: extract & save memory if meaningful insight detected
```

### System Prompt Construction

```
You are SmartAds AI, an expert in Meta Ads and Shopify e-commerce.

Active context:
- Meta Ads Account: {accountName} ({accountId})
- Shopify Store: {storeName} ({storeUrl})

Relevant memory:
- {memory entries scoped to active accounts}

Rules:
- Only query/modify the active accounts above
- Never access data from other accounts
- When providing insights, reference specific metrics
- If user asks about an unconnected account, prompt them to connect it
```

### Real-Time Tool Status Streaming

Using Vercel AI SDK's data stream protocol:
- `sendToolCallChunks: true` in `toDataStreamResponse()`
- Client receives `toolInvocations` on each message with status transitions: `"call"` → `"result"` (or `"partial-call"` when tool call arguments are being streamed)
- UI renders live activity indicators per tool call

```
🔄 Fetching campaign insights...     ← status: "call"
✓ Got insights for 12 campaigns      ← status: "result"
🔄 Fetching Shopify orders...        ← status: "call"
```

### Memory Extraction

After the stream completes, a second LLM call (using the same model, short prompt) analyzes the conversation turn and returns structured JSON indicating whether any memories should be saved.

**Extraction prompt template:**
```
Given this conversation turn, extract any of the following if present:
- Business insights (performance data, trends, anomalies)
- User preferences (reporting style, favorite metrics, thresholds)
- Strategic decisions (pausing campaigns, budget changes, targeting shifts)

Return JSON: { memories: [{ category, content, scopeId }] } or { memories: [] }
```

**Deduplication:** Before saving, query existing memories with matching `userId` + `scopeId` + `category` and check for semantic overlap (simple substring/keyword match for MVP, vector similarity later). Update existing memory if overlap found, create new if not.

**Retention:** No automatic expiry for MVP. Future: add `lastAccessedAt` field and prune stale memories.

Saved to `memory` collection with `scopeId` isolation matching the active account context.

### Composio Integration

The Composio SDK API (`@composio/core` + `@composio/vercel`) will be used as documented. The exact API shape should be verified against the installed package version during implementation, as the SDK is actively evolving. The core pattern is:

1. Initialize Composio with the Vercel provider
2. Create a user-scoped session using the Firebase `userId` as the entity identifier
3. Retrieve tools scoped to that user's connected accounts
4. Pass tools directly to Vercel AI SDK's `streamText()`

Composio maps the user identifier to their connected accounts internally — tools returned are already scoped to that user's authenticated Meta Ads and Shopify connections.

---

## UI/UX Design

### Aesthetic
Dark-mode-first, clean SaaS feel (Linear/Vercel dashboard style). Minimal chrome, generous whitespace, subtle animations, snappy transitions.

### Layout

```
┌──────────────────────────────────────────────────────┐
│ Topbar: Logo | Workspace selector (dropdown) | User avatar │
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│  Sidebar   │              Chat Area                  │
│            │                                         │
│ + New Chat │  Account selector pills:                │
│            │  [Meta: BrandX ▼] [Shopify: StoreA ▼]   │
│ Today      │                                         │
│  Chat 1    │  Messages...                            │
│  Chat 2    │                                         │
│            │  Tool Activity (inline):                │
│ Yesterday  │  ✓ Fetched 12 campaigns                 │
│  Chat 3    │  🔄 Analyzing performance...             │
│            │                                         │
│ Workspaces │  [Message input...        ] [Send]      │
│ Settings   │                                         │
└────────────┴─────────────────────────────────────────┘
```

### Key Components

1. **Collapsible sidebar** — conversation history grouped by date, workspace nav, collapses to icons
2. **Account selector pills** — persistent above chat, shows active accounts, subtle glow when active
3. **Chat messages** — markdown rendered, tables for data, token-by-token streaming
4. **Tool activity cards** — inline with AI response, spinner → checkmark animation, expandable for raw data
5. **Connect account prompt** — inline card in chat when no accounts connected, triggers Composio OAuth
6. **Settings page** — tabs for Profile, Integrations (connect/disconnect), Workspaces

### Interactions
- Sidebar: smooth slide animation (200ms)
- Messages: subtle fade-up on appear
- Tool status: spinner → checkmark micro-animation
- Account selector: dropdown with search
- Streaming: no layout shift, smooth scroll-to-bottom
- Dark mode default, light mode toggle available

### Responsive
- Sidebar becomes drawer on mobile
- Chat always full-width
- Account selector stacks vertically on small screens

---

## Error Handling

### API & Network
- **Composio fails** — toast "Couldn't reach Meta Ads. Retrying..." with 3 retries, exponential backoff. If all fail, inline chat message to check connected account.
- **LLM fails** — "AI is temporarily unavailable. Your message has been saved." Retry button.
- **Firestore write fails** — optimistic UI, warning icon on message with retry option.
- **Stream interrupted** — partial response preserved, "Response was interrupted" indicator.

### Auth Edge Cases
- **Token expired** — Firebase client SDK auto-refreshes. If refresh fails, redirect to login with "Session expired" toast.
- **Composio OAuth revoked** — tool calls fail, AI prompts user to reconnect via settings.

### Multi-Account Safety
- **Account switch mid-conversation** — new messages use new context, previous messages retain original context.
- **Workspace deleted** — soft-delete (add `deletedAt` timestamp). Conversations and memories associated with the workspace are preserved but hidden from active views. Connected accounts on the workspace are disconnected from Composio. Admin can hard-delete later.

### Rate Limiting
- **Per-user:** 30 messages/minute on `/api/chat`, returns 429.
- **Implementation:** Upstash Redis (serverless, Vercel-compatible) for distributed rate limiting across serverless invocations. `@upstash/ratelimit` package with sliding window algorithm.
- **Composio API limits:** respect and queue, inform user of delay.

### Graceful Degradation
- If Composio is fully down, chat works as general AI assistant without tool access.

---

## Security

### Environment Variables

```
OPENROUTER_API_KEY      — server-side only
LLM_MODEL               — e.g., "anthropic/claude-sonnet-4-6"
LLM_PROVIDER            — e.g., "openrouter"
COMPOSIO_API_KEY        — server-side only
FIREBASE_ADMIN_*        — service account credentials, server-side only
NEXT_PUBLIC_FIREBASE_*  — client-side Firebase config (safe to expose)
```

### Data Access
- Every API route uses `withAuth()` — no exceptions
- `userId` always extracted from verified Firebase token, never from request body
- All Firestore queries include `userId` filter
- Composio sessions scoped by `userId`

### Input/Output
- Tool results rendered with safe markdown renderer (no raw HTML)
- No `dangerouslySetInnerHTML`

### Firestore Security Rules (Defense in Depth)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /workspaces/{workspaceId} {
      allow create: if request.auth != null &&
        request.resource.data.ownerId == request.auth.uid;
      allow read, update, delete: if request.auth != null &&
        resource.data.ownerId == request.auth.uid;
    }
    match /conversations/{convoId} {
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null &&
        resource.data.userId == request.auth.uid;
      match /messages/{msgId} {
        allow read, write: if request.auth != null &&
          get(/databases/$(database)/documents/conversations/$(convoId)).data.userId == request.auth.uid;
      }
    }
    match /memory/{memoryId} {
      allow create: if request.auth != null &&
        request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

All data mutations happen server-side via Admin SDK (bypasses rules). Rules are a safety net for defense in depth.

---

## Observability

- **Error tracking:** Sentry for runtime errors (client + server)
- **LLM observability:** Log token usage, latency, and tool call counts per request to Firestore (lightweight). Migrate to Helicone or Langfuse when volume justifies it.
- **Structured logging:** `console.log` with JSON format for Vercel's log drain. Include `userId`, `conversationId`, `toolName` in log context.

---

## Future Considerations (Not in Scope Now)

- **Billing/plans** — tier system with limits on messages, accounts, workspaces
- **Team access** — multiple users per workspace with roles
- **Vector embeddings** — RAG-based memory retrieval for better context
- **Custom skills** — user-defined AI skills/workflows
- **Fly.io migration** — extract `/api/chat` to Fly.io if Vercel compute costs spike
