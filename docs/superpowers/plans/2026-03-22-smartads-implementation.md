# SmartAds AI Chatbot Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready SaaS AI chatbot with Meta Ads and Shopify MCP tool access via Composio, Firebase auth, Firestore persistence, and a modern dark-mode UI.

**Architecture:** Monolithic Next.js 15 App Router app deployed on Vercel with Fluid Compute. Firebase Auth (Google Sign-In) + Firestore for data. Vercel AI SDK + OpenRouter for LLM. Composio SDK for Meta Ads & Shopify tools.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Firebase Auth, Firestore, Vercel AI SDK, OpenRouter, Composio (`@composio/core` + `@composio/vercel`), Zustand, pnpm

**Spec:** `docs/superpowers/specs/2026-03-22-smartads-ai-chatbot-design.md`

---

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── chat/
│   │   │   └── [[...id]]/
│   │   │       └── page.tsx
│   │   ├── workspaces/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── route.ts
│   │   │   └── signout/
│   │   │       └── route.ts
│   │   ├── chat/
│   │   │   └── route.ts
│   │   ├── conversations/
│   │   │   └── route.ts
│   │   └── workspaces/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── chat/
│   │   ├── chat-area.tsx
│   │   ├── chat-input.tsx
│   │   ├── chat-message.tsx
│   │   ├── tool-activity.tsx
│   │   └── account-selector.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── user-menu.tsx
│   ├── providers/
│   │   └── auth-provider.tsx
│   └── ui/ (shadcn components)
├── lib/
│   ├── firebase/
│   │   ├── client.ts
│   │   └── admin.ts
│   ├── composio/
│   │   └── client.ts
│   ├── ai/
│   │   ├── provider.ts
│   │   └── system-prompt.ts
│   ├── auth/
│   │   └── with-auth.ts
│   └── firestore/
│       ├── users.ts
│       ├── workspaces.ts
│       ├── conversations.ts
│       └── memory.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-conversations.ts
│   └── use-workspaces.ts
├── types/
│   └── index.ts
├── stores/
│   └── ui-store.ts
└── middleware.ts
```

---

## Chunk 1: Project Scaffolding & Configuration

### Task 1: Scaffold Next.js 15 Project

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`

- [ ] **Step 1: Create Next.js 15 app with pnpm**

```bash
cd E:/Work/smartAds
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Select defaults: Yes to all prompts.

- [ ] **Step 2: Verify the app runs**

```bash
cd E:/Work/smartAds && pnpm dev
```
Expected: App runs on localhost:3000 with default Next.js page.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js 15 project"
```

### Task 2: Install All Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install core dependencies**

```bash
cd E:/Work/smartAds
pnpm add ai @ai-sdk/openai @composio/core @composio/vercel firebase firebase-admin zustand sonner react-markdown remark-gfm lucide-react clsx tailwind-merge
```

- [ ] **Step 2: Install dev dependencies**

```bash
pnpm add -D @types/node
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml && git commit -m "chore: install project dependencies"
```

### Task 3: Configure shadcn/ui and Environment

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `.env.local`, `.env.example`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Initialize shadcn/ui**

```bash
cd E:/Work/smartAds
pnpm dlx shadcn@latest init
```

Select: New York style, Zinc color, CSS variables: yes.

- [ ] **Step 2: Add essential shadcn components**

```bash
pnpm dlx shadcn@latest add button input avatar dropdown-menu dialog scroll-area separator tooltip tabs badge sheet
```

- [ ] **Step 3: Create .env.example**

```env
# OpenRouter
OPENROUTER_API_KEY=
LLM_MODEL=anthropic/claude-sonnet-4-6
LLM_PROVIDER=openrouter

# Composio
COMPOSIO_API_KEY=

# Firebase Admin (server-side)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

- [ ] **Step 4: Create .env.local with placeholder values**

Copy `.env.example` to `.env.local` and fill in real values.

- [ ] **Step 5: Add .env.local to .gitignore (verify it's there)**

- [ ] **Step 6: Set up dark-mode globals.css**

Replace `src/app/globals.css` with Tailwind v4 setup plus dark-mode-first custom theme using zinc/neutral palette. The design calls for Linear/Vercel dashboard aesthetic: dark backgrounds (#09090b, #18181b), subtle borders (#27272a), clean typography.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: configure shadcn/ui, env vars, dark theme"
```

---

## Chunk 2: TypeScript Types & Firebase Setup

### Task 4: Define TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create all type definitions**

```typescript
// src/types/index.ts
import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  defaultWorkspaceId: string | null;
  settings: UserSettings;
}

export interface UserSettings {
  theme: "dark" | "light";
}

export interface ConnectedAccount {
  provider: "meta_ads" | "shopify";
  accountId: string;
  accountName: string;
  composioConnectionId: string;
}

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  icon: string;
  createdAt: Timestamp;
  deletedAt: Timestamp | null;
  connectedAccounts: ConnectedAccount[];
}

export interface ActiveAccountContext {
  metaAdsAccountId: string | null;
  shopifyStoreId: string | null;
}

export interface Conversation {
  id: string;
  userId: string;
  workspaceId: string | null;
  title: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: "active" | "archived";
  activeAccountContext: ActiveAccountContext;
}

export interface ToolInvocation {
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "call" | "partial-call" | "result";
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolInvocations: ToolInvocation[];
  createdAt: Timestamp;
  tokenUsage: { prompt: number; completion: number } | null;
}

export interface Memory {
  id: string;
  userId: string;
  scope: "global" | "account";
  scopeId: string | null;
  workspaceId: string | null;
  category: "business_context" | "preference" | "insight";
  content: string;
  source: { conversationId: string; messageId: string };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChatRequestBody {
  messages: { role: string; content: string }[];
  conversationId?: string;
  workspaceId?: string;
  activeAccounts?: ActiveAccountContext;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts && git commit -m "feat: add TypeScript type definitions"
```

### Task 5: Firebase Client SDK Init

**Files:**
- Create: `src/lib/firebase/client.ts`

- [ ] **Step 1: Create Firebase client initialization**

```typescript
// src/lib/firebase/client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/firebase/client.ts && git commit -m "feat: add Firebase client SDK initialization"
```

### Task 6: Firebase Admin SDK Init

**Files:**
- Create: `src/lib/firebase/admin.ts`

- [ ] **Step 1: Create Firebase Admin initialization**

```typescript
// src/lib/firebase/admin.ts
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let app: App;

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
} else {
  app = getApps()[0];
}

const adminAuth = getAuth(app);
const adminDb = getFirestore(app);

export { adminAuth, adminDb };
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/firebase/admin.ts && git commit -m "feat: add Firebase Admin SDK initialization"
```

---

## Chunk 3: Authentication System

### Task 7: Auth API Routes

**Files:**
- Create: `src/lib/auth/with-auth.ts`, `src/app/api/auth/route.ts`, `src/app/api/auth/signout/route.ts`

- [ ] **Step 1: Create withAuth wrapper**

```typescript
// src/lib/auth/with-auth.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

interface AuthContext {
  userId: string;
  email: string;
}

type AuthenticatedHandler = (
  req: NextRequest,
  ctx: AuthContext
) => Promise<NextResponse | Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextRequest) => {
    const sessionCookie = req.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie,
        true
      );
      return handler(req, {
        userId: decodedClaims.uid,
        email: decodedClaims.email || "",
      });
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  };
}
```

- [ ] **Step 2: Create auth login route**

```typescript
// src/app/api/auth/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

const FOURTEEN_DAYS = 60 * 60 * 24 * 14 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: FOURTEEN_DAYS,
    });

    const response = NextResponse.json({
      success: true,
      uid: decodedToken.uid,
    });

    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14, // 14 days in seconds
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
```

- [ ] **Step 3: Create signout route**

```typescript
// src/app/api/auth/signout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session")?.value;

  if (sessionCookie) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      await adminAuth.revokeRefreshTokens(decodedClaims.uid);
    } catch {
      // Cookie invalid, still clear it
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth/ src/app/api/auth/ && git commit -m "feat: add auth API routes and withAuth wrapper"
```

### Task 8: Auth Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check session cookie presence
  const session = req.cookies.get("session");
  if (!session?.value) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts && git commit -m "feat: add auth middleware for route protection"
```

### Task 9: Auth Provider & Hook

**Files:**
- Create: `src/components/providers/auth-provider.tsx`, `src/hooks/use-auth.ts`

- [ ] **Step 1: Create auth hook**

```typescript
// src/hooks/use-auth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setState({ user, loading: false });
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    // Create session cookie on server
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) throw new Error("Failed to create session");
    return result.user;
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    await firebaseSignOut(auth);
  }, []);

  return { ...state, signIn, signOut };
}
```

- [ ] **Step 2: Create auth provider**

```typescript
// src/components/providers/auth-provider.tsx
"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { User as FirebaseUser } from "firebase/auth";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: () => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-auth.ts src/components/providers/ && git commit -m "feat: add auth provider and useAuth hook"
```

### Task 10: Login Page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create login page**

A minimal, dark-themed login page with centered card, SmartAds logo/title, "Sign in with Google" button using shadcn Button. On success, redirect to `/chat`. Uses `useAuthContext()` hook. Shows loading spinner during auth. Full-page dark background (#09090b).

- [ ] **Step 2: Verify login flow works end-to-end**

```bash
pnpm dev
```
Navigate to localhost:3000 → should redirect to /login. Click Google Sign-In → should authenticate and redirect to /chat (will 404 for now, that's fine).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/ && git commit -m "feat: add Google Sign-In login page"
```

---

## Chunk 4: Dashboard Layout Shell

### Task 11: Root Layout with Providers

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update root layout**

Set up the root `<html>` with `className="dark"` (dark mode default), import globals.css, wrap children with `AuthProvider` and `Toaster` (from sonner). Set metadata title/description. Use Inter font from next/font/google.

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx && git commit -m "feat: configure root layout with providers and dark theme"
```

### Task 12: UI Store (Zustand)

**Files:**
- Create: `src/stores/ui-store.ts`

- [ ] **Step 1: Create UI state store**

```typescript
// src/stores/ui-store.ts
import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  activeMetaAdsAccountId: string | null;
  setActiveMetaAdsAccountId: (id: string | null) => void;
  activeShopifyStoreId: string | null;
  setActiveShopifyStoreId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeWorkspaceId: null,
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),
  activeMetaAdsAccountId: null,
  setActiveMetaAdsAccountId: (id) => set({ activeMetaAdsAccountId: id }),
  activeShopifyStoreId: null,
  setActiveShopifyStoreId: (id) => set({ activeShopifyStoreId: id }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/ && git commit -m "feat: add Zustand UI state store"
```

### Task 13: Sidebar Component

**Files:**
- Create: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Create sidebar**

Dark sidebar (bg-zinc-950, border-r border-zinc-800). Contains:
- Top: SmartAds logo + "New Chat" button (lucide Plus icon)
- Middle: Conversation list (grouped by "Today", "Yesterday", "Previous 7 Days") using shadcn ScrollArea. Each item shows title, truncated, with hover highlight (bg-zinc-800/50). Active conversation has subtle left border accent.
- Bottom: "Workspaces" link and "Settings" link with lucide icons.
- Collapsible: when `sidebarOpen` is false from UIStore, sidebar collapses to a narrow strip with only icons.
- Width: 280px expanded, 60px collapsed. Transition: 200ms ease.
- On mobile (< 768px): render as shadcn Sheet (drawer overlay).

Props: `conversations: Conversation[]`, `activeConversationId?: string`, `onNewChat: () => void`, `onSelectConversation: (id: string) => void`

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/sidebar.tsx && git commit -m "feat: add collapsible sidebar component"
```

### Task 14: Topbar Component

**Files:**
- Create: `src/components/layout/topbar.tsx`, `src/components/layout/user-menu.tsx`

- [ ] **Step 1: Create user menu**

Dropdown using shadcn DropdownMenu. Trigger: user's Avatar (photoURL). Items: "Settings", separator, "Sign out". Uses `useAuthContext()` for user data and signOut.

- [ ] **Step 2: Create topbar**

Full-width, h-14, bg-zinc-950, border-b border-zinc-800. Contains:
- Left: sidebar toggle button (lucide PanelLeft icon), workspace selector dropdown (shadcn DropdownMenu showing active workspace name, list of workspaces, "All Workspaces" option).
- Right: UserMenu component.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/ && git commit -m "feat: add topbar with workspace selector and user menu"
```

### Task 15: Dashboard Layout

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create dashboard layout**

Flexbox layout: Sidebar (left) + main content area (right, flex-1). Topbar above the content area. Full viewport height. Uses UIStore for sidebar state. Fetches user's conversations from Firestore for sidebar. Root `page.tsx` redirects to `/chat`.

- [ ] **Step 2: Update root page to redirect**

```typescript
// src/app/page.tsx
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/chat");
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/layout.tsx src/app/page.tsx && git commit -m "feat: add dashboard layout with sidebar and topbar"
```

---

## Chunk 5: Firestore Data Layer

### Task 16: User CRUD

**Files:**
- Create: `src/lib/firestore/users.ts`

- [ ] **Step 1: Create user Firestore operations**

```typescript
// src/lib/firestore/users.ts
import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

const usersRef = adminDb.collection("users");

export async function createOrUpdateUser(user: {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}) {
  const userDoc = usersRef.doc(user.uid);
  const existing = await userDoc.get();

  if (existing.exists) {
    await userDoc.update({ lastLoginAt: Timestamp.now() });
  } else {
    await userDoc.set({
      ...user,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      defaultWorkspaceId: null,
      settings: { theme: "dark" },
    });
  }
}

export async function getUser(userId: string) {
  const doc = await usersRef.doc(userId).get();
  return doc.exists ? { uid: doc.id, ...doc.data() } : null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/firestore/users.ts && git commit -m "feat: add user Firestore operations"
```

### Task 17: Conversation CRUD

**Files:**
- Create: `src/lib/firestore/conversations.ts`

- [ ] **Step 1: Create conversation Firestore operations**

Functions:
- `createConversation(userId, title, workspaceId?, activeAccountContext?)` — creates doc, returns id
- `getConversation(conversationId, userId)` — get single, verify ownership
- `listConversations(userId, workspaceId?, cursor?, limit=20)` — paginated, ordered by updatedAt desc
- `updateConversation(conversationId, userId, data)` — partial update
- `addMessage(conversationId, message)` — adds to messages subcollection
- `getMessages(conversationId, cursor?, limit=50)` — paginated, ordered by createdAt desc

All queries filter by `userId` for security. Uses `firebase-admin/firestore` (server-side).

- [ ] **Step 2: Commit**

```bash
git add src/lib/firestore/conversations.ts && git commit -m "feat: add conversation and message Firestore operations"
```

### Task 18: Workspace & Memory CRUD

**Files:**
- Create: `src/lib/firestore/workspaces.ts`, `src/lib/firestore/memory.ts`

- [ ] **Step 1: Create workspace operations**

Functions:
- `createWorkspace(ownerId, name, description?, icon?)` — returns id
- `listWorkspaces(ownerId)` — all non-deleted workspaces for user
- `getWorkspace(workspaceId, ownerId)` — get single, verify ownership
- `updateWorkspace(workspaceId, ownerId, data)` — partial update
- `deleteWorkspace(workspaceId, ownerId)` — soft delete (set deletedAt)
- `addConnectedAccount(workspaceId, ownerId, account)` — push to connectedAccounts array
- `removeConnectedAccount(workspaceId, ownerId, accountId)` — remove from array

- [ ] **Step 2: Create memory operations**

Functions:
- `saveMemory(memory)` — create new memory doc
- `getMemories(userId, scopeId?, category?, limit=20)` — query with filters
- `findSimilarMemory(userId, scopeId, category, content)` — simple substring match for dedup
- `updateMemory(memoryId, userId, content)` — update content + updatedAt
- `deleteMemory(memoryId, userId)` — hard delete

All queries include `userId` filter.

- [ ] **Step 3: Commit**

```bash
git add src/lib/firestore/workspaces.ts src/lib/firestore/memory.ts && git commit -m "feat: add workspace and memory Firestore operations"
```

---

## Chunk 6: AI Chat Integration

### Task 19: OpenRouter Provider Config

**Files:**
- Create: `src/lib/ai/provider.ts`

- [ ] **Step 1: Create AI provider**

```typescript
// src/lib/ai/provider.ts
import { createOpenAI } from "@ai-sdk/openai";

export const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export function getModel() {
  const modelId = process.env.LLM_MODEL || "anthropic/claude-sonnet-4-6";
  return openrouter(modelId);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/provider.ts && git commit -m "feat: add OpenRouter AI provider configuration"
```

### Task 20: System Prompt Builder

**Files:**
- Create: `src/lib/ai/system-prompt.ts`

- [ ] **Step 1: Create system prompt builder**

```typescript
// src/lib/ai/system-prompt.ts
import { Memory, ActiveAccountContext } from "@/types";

interface PromptContext {
  activeAccounts?: ActiveAccountContext;
  accountNames?: { metaAds?: string; shopify?: string };
  memories: Memory[];
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const parts: string[] = [
    `You are SmartAds AI, an expert assistant for Meta Ads and Shopify e-commerce marketing.`,
    `You help brand owners and agencies analyze campaign performance, optimize ad spend, track orders, and make data-driven marketing decisions.`,
  ];

  // Active account context
  if (ctx.activeAccounts?.metaAdsAccountId || ctx.activeAccounts?.shopifyStoreId) {
    parts.push(`\nActive context:`);
    if (ctx.activeAccounts.metaAdsAccountId) {
      parts.push(`- Meta Ads Account: ${ctx.accountNames?.metaAds || ctx.activeAccounts.metaAdsAccountId}`);
    }
    if (ctx.activeAccounts.shopifyStoreId) {
      parts.push(`- Shopify Store: ${ctx.accountNames?.shopify || ctx.activeAccounts.shopifyStoreId}`);
    }
  }

  // Memory context
  if (ctx.memories.length > 0) {
    parts.push(`\nRelevant context from previous conversations:`);
    for (const mem of ctx.memories) {
      parts.push(`- [${mem.category}] ${mem.content}`);
    }
  }

  parts.push(`\nRules:`);
  parts.push(`- Only query or modify the active accounts listed above.`);
  parts.push(`- Never access data from accounts not listed in the active context.`);
  parts.push(`- When providing insights, reference specific metrics and numbers.`);
  parts.push(`- If the user asks about an account that isn't connected, suggest they connect it in Settings.`);
  parts.push(`- Format data in tables when comparing metrics across campaigns or time periods.`);
  parts.push(`- Be concise but thorough. Lead with the key insight, then supporting data.`);

  return parts.join("\n");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/system-prompt.ts && git commit -m "feat: add system prompt builder with memory and account context"
```

### Task 21: Composio Client Setup

**Files:**
- Create: `src/lib/composio/client.ts`

- [ ] **Step 1: Create Composio client**

Initialize Composio with VercelProvider. Export a function `getToolsForUser(userId)` that creates a session and returns tools. Wrap in try/catch — if Composio is unavailable, return empty tools array (graceful degradation). Log errors with userId context.

Note: Verify the exact API against installed `@composio/core` and `@composio/vercel` package versions during implementation. The SDK is evolving — check the package's exported members and adjust accordingly.

- [ ] **Step 2: Commit**

```bash
git add src/lib/composio/client.ts && git commit -m "feat: add Composio client for Meta Ads and Shopify tools"
```

### Task 22: Chat API Route

**Files:**
- Create: `src/app/api/chat/route.ts`

- [ ] **Step 1: Create chat route with streaming**

```typescript
// src/app/api/chat/route.ts
import { streamText } from "ai";
import { withAuth } from "@/lib/auth/with-auth";
import { getModel } from "@/lib/ai/provider";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { getToolsForUser } from "@/lib/composio/client";
import { getMemories } from "@/lib/firestore/memory";
import { ChatRequestBody } from "@/types";

export const maxDuration = 300; // 5 minutes — Fluid Compute

export const POST = withAuth(async (req, { userId }) => {
  const body: ChatRequestBody = await req.json();
  const { messages, activeAccounts } = body;

  // Load scoped memories
  const memories = await getMemories(
    userId,
    activeAccounts?.metaAdsAccountId || activeAccounts?.shopifyStoreId || undefined
  );

  // Get Composio tools for this user
  const tools = await getToolsForUser(userId);

  // Build system prompt
  const systemPrompt = buildSystemPrompt({
    activeAccounts,
    memories,
  });

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages,
    tools,
    maxSteps: 15,
  });

  return result.toDataStreamResponse();
});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/chat/route.ts && git commit -m "feat: add chat API route with streaming and Composio tools"
```

### Task 23: Conversations API Route

**Files:**
- Create: `src/app/api/conversations/route.ts`

- [ ] **Step 1: Create conversations list/create route**

GET handler: list conversations for authenticated user, with optional `workspaceId` query param and cursor-based pagination.
POST handler: create new conversation with title, optional workspaceId, optional activeAccountContext.

Both use `withAuth()`.

- [ ] **Step 2: Commit**

```bash
git add src/app/api/conversations/ && git commit -m "feat: add conversations API route"
```

---

## Chunk 7: Chat UI Components

### Task 24: Chat Message Component

**Files:**
- Create: `src/components/chat/chat-message.tsx`

- [ ] **Step 1: Create message component**

Renders a single chat message. Two variants:
- **User message:** right-aligned, bg-zinc-800 rounded bubble, user avatar.
- **Assistant message:** left-aligned, full-width, bg-transparent. Content rendered via `react-markdown` with `remark-gfm` for tables/code blocks. Custom renderers for code blocks (dark bg, syntax highlighting placeholder), tables (bordered zinc-800), and links (text-blue-400).

Props: `message: { role, content, toolInvocations? }`. Subtle fade-in animation on mount (CSS animation).

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/chat-message.tsx && git commit -m "feat: add chat message component with markdown rendering"
```

### Task 25: Tool Activity Component

**Files:**
- Create: `src/components/chat/tool-activity.tsx`

- [ ] **Step 1: Create tool activity card**

Renders inline tool status during AI response. Shows:
- Spinner (lucide Loader2, animate-spin) + tool name in human-readable form when status is `"call"` — e.g., "Fetching campaign insights..."
- Checkmark (lucide Check) + result summary when status is `"result"` — e.g., "Got insights for 12 campaigns"
- Collapsed by default, click to expand and see raw args/result in a code block.

Styling: bg-zinc-900/50, rounded-lg, border border-zinc-800, p-3. Subtle transition from spinner to checkmark.

Tool name mapping: `GMAIL_FETCH_EMAILS` → "Fetching emails", `META_ADS_GET_INSIGHTS` → "Fetching ad insights", etc. Fallback: humanize the tool name (split on underscore, lowercase).

Props: `toolInvocation: ToolInvocation`

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/tool-activity.tsx && git commit -m "feat: add tool activity card with spinner/checkmark animation"
```

### Task 26: Account Selector

**Files:**
- Create: `src/components/chat/account-selector.tsx`

- [ ] **Step 1: Create account selector pills**

Horizontal bar above chat area. Shows pill buttons for connected accounts:
- Meta Ads pills: badge with Meta icon, account name, dropdown to switch accounts
- Shopify pills: badge with Shopify icon, store name, dropdown to switch stores
- If no accounts connected: show "Connect accounts" link → /settings

Uses UIStore for active account state. Each pill: bg-zinc-900, border border-zinc-700, rounded-full, px-3 py-1. Active pill has ring-1 ring-blue-500 glow effect.

Props: `connectedAccounts: ConnectedAccount[]`

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/account-selector.tsx && git commit -m "feat: add account selector pills component"
```

### Task 27: Chat Input Component

**Files:**
- Create: `src/components/chat/chat-input.tsx`

- [ ] **Step 1: Create chat input**

Bottom-pinned input area. Contains:
- Textarea (auto-resizing, max 200px height) with placeholder "Ask about your campaigns, orders, performance..."
- Send button (lucide SendHorizonal icon) — enabled only when input is non-empty and not loading.
- Submit on Enter (without Shift). Shift+Enter for newline.
- Loading state: send button shows spinner, input is disabled.

Styling: bg-zinc-900, border border-zinc-800, rounded-2xl. Focus ring: ring-zinc-600. Sticky bottom with bg gradient fade above.

Props: `onSubmit: (message: string) => void`, `isLoading: boolean`

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/chat-input.tsx && git commit -m "feat: add auto-resizing chat input component"
```

### Task 28: Chat Area (Main Container)

**Files:**
- Create: `src/components/chat/chat-area.tsx`

- [ ] **Step 1: Create chat area container**

Main chat container using Vercel AI SDK's `useChat` hook. Composes ChatMessage, ToolActivity, ChatInput, and AccountSelector.

```typescript
// Key integration points:
// 1. useChat hook connects to /api/chat
// 2. Pass activeAccounts in request body
// 3. Render messages with tool invocations inline
// 4. Auto-scroll to bottom on new messages
// 5. Empty state: centered "How can I help with your marketing today?" with suggestion chips
```

The `useChat` hook config:
- `api: "/api/chat"`
- `body: { activeAccounts: { metaAdsAccountId, shopifyStoreId }, workspaceId }` from UIStore
- `onFinish`: save conversation to Firestore (create if new, update if existing)

Messages rendering: map over `messages` array. For each message, render ChatMessage. For assistant messages that have `toolInvocations`, render ToolActivity cards before the text content.

Empty state (no messages): dark centered layout with large greeting text, 3-4 suggestion chips like "How are my Meta Ads performing this week?", "Show me top-selling products on Shopify", "Compare ROAS across campaigns".

Auto-scroll: useRef on scroll container, scrollIntoView on new messages with `behavior: 'smooth'`.

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/chat-area.tsx && git commit -m "feat: add chat area container with useChat integration"
```

### Task 29: Chat Page

**Files:**
- Create: `src/app/(dashboard)/chat/[[...id]]/page.tsx`

- [ ] **Step 1: Create chat page**

Server component that extracts conversation ID from params (optional catch-all). If ID provided, fetch conversation data and pass to ChatArea. If no ID, render ChatArea in "new chat" mode.

Client boundary: the ChatArea component handles all client-side state.

- [ ] **Step 2: Verify full chat flow**

```bash
pnpm dev
```
Navigate to /chat → should see empty state with suggestions. Type a message → should stream response from AI (may fail if env vars not set — that's expected).

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/chat/ && git commit -m "feat: add chat page with conversation routing"
```

---

## Chunk 8: Settings, Workspaces & Final Integration

### Task 30: Workspaces API & Page

**Files:**
- Create: `src/app/api/workspaces/route.ts`, `src/app/(dashboard)/workspaces/page.tsx`, `src/hooks/use-workspaces.ts`

- [ ] **Step 1: Create workspaces API route**

GET: list workspaces for user. POST: create workspace. Uses withAuth.

- [ ] **Step 2: Create useWorkspaces hook**

Client-side hook that fetches workspaces from `/api/workspaces`. Returns `{ workspaces, loading, createWorkspace, deleteWorkspace }`.

- [ ] **Step 3: Create workspaces page**

Grid of workspace cards. Each card shows: icon, name, description, count of connected accounts, "Open" and "Delete" actions. "Create Workspace" button opens a Dialog with name/description/icon inputs. Delete shows confirmation dialog, calls soft-delete API.

Styling: cards are bg-zinc-900, border border-zinc-800, rounded-xl, hover:border-zinc-700 transition.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/workspaces/ src/app/\(dashboard\)/workspaces/ src/hooks/use-workspaces.ts && git commit -m "feat: add workspace management page and API"
```

### Task 31: Settings Page

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Create settings page with tabs**

Two tabs using shadcn Tabs:

**Profile tab:**
- User info card: avatar, name, email (read-only from Google)
- Theme toggle (dark/light) — updates user.settings in Firestore

**Integrations tab:**
- "Connected Accounts" section
- For each connected account: card showing provider icon, account name, "Disconnect" button
- "Connect Meta Ads" button — triggers Composio OAuth flow
- "Connect Shopify" button — triggers Composio OAuth flow
- Note: Composio OAuth integration details will be finalized during implementation based on SDK docs

Styling: max-w-2xl mx-auto, consistent with dark theme.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(dashboard\)/settings/ && git commit -m "feat: add settings page with profile and integrations tabs"
```

### Task 32: Conversations Hook & Sidebar Integration

**Files:**
- Create: `src/hooks/use-conversations.ts`

- [ ] **Step 1: Create useConversations hook**

Fetches conversations from `/api/conversations`. Returns `{ conversations, loading, createConversation, loadMore, hasMore }`. Supports cursor-based pagination.

- [ ] **Step 2: Wire sidebar to real data**

Update dashboard layout to use `useConversations` hook and pass data to Sidebar. Wire "New Chat" button to create conversation and navigate. Wire conversation click to navigate to `/chat/[id]`.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-conversations.ts && git commit -m "feat: add conversations hook and wire sidebar"
```

### Task 33: Conversation Persistence in Chat

**Files:**
- Modify: `src/components/chat/chat-area.tsx`, `src/app/api/chat/route.ts`

- [ ] **Step 1: Add conversation save on chat completion**

In the chat API route's `onFinish` callback or via a separate client-side call after `onFinish` in `useChat`:
- If new conversation (no ID): create conversation doc, save messages, return new ID. Client navigates to `/chat/[newId]` via `window.history.replaceState` (no full reload).
- If existing conversation: append new messages to subcollection, update `updatedAt`.
- Auto-generate title from first user message (first 50 chars).

- [ ] **Step 2: Add message loading for existing conversations**

When chat page loads with an ID, fetch existing messages from Firestore and pass as `initialMessages` to `useChat`.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat/chat-area.tsx src/app/api/chat/route.ts && git commit -m "feat: add conversation persistence and message loading"
```

### Task 34: Memory System Integration

**Files:**
- Create: `src/lib/memory/manager.ts`

- [ ] **Step 1: Create memory manager**

```typescript
// src/lib/memory/manager.ts
import { generateText } from "ai";
import { getModel } from "@/lib/ai/provider";
import { saveMemory, findSimilarMemory, updateMemory } from "@/lib/firestore/memory";

const EXTRACTION_PROMPT = `Analyze this conversation turn and extract any of the following if present:
- Business insights (performance data, trends, anomalies the user discussed)
- User preferences (reporting style, favorite metrics, thresholds they mentioned)
- Strategic decisions (pausing campaigns, budget changes, targeting shifts)

Return ONLY valid JSON: { "memories": [{ "category": "business_context" | "preference" | "insight", "content": "concise summary" }] }
If nothing worth remembering, return: { "memories": [] }`;

export async function extractAndSaveMemories(params: {
  userId: string;
  conversationId: string;
  messageId: string;
  userMessage: string;
  assistantMessage: string;
  scopeId: string | null;
  workspaceId: string | null;
}) {
  try {
    const { text } = await generateText({
      model: getModel(),
      prompt: `${EXTRACTION_PROMPT}\n\nUser: ${params.userMessage}\nAssistant: ${params.assistantMessage}`,
    });

    const parsed = JSON.parse(text);
    if (!parsed.memories?.length) return;

    for (const mem of parsed.memories) {
      // Dedup check
      const existing = await findSimilarMemory(
        params.userId,
        params.scopeId,
        mem.category,
        mem.content
      );

      if (existing) {
        await updateMemory(existing.id, params.userId, mem.content);
      } else {
        await saveMemory({
          userId: params.userId,
          scope: params.scopeId ? "account" : "global",
          scopeId: params.scopeId,
          workspaceId: params.workspaceId,
          category: mem.category,
          content: mem.content,
          source: {
            conversationId: params.conversationId,
            messageId: params.messageId,
          },
        });
      }
    }
  } catch (error) {
    console.error("[memory] extraction failed:", JSON.stringify({ userId: params.userId, error }));
    // Non-critical — don't fail the chat
  }
}
```

- [ ] **Step 2: Integrate memory extraction into chat flow**

In the chat API route, after stream completes, call `extractAndSaveMemories` in the background (don't block the response). Use `waitUntil` if available on Vercel, or fire-and-forget.

- [ ] **Step 3: Commit**

```bash
git add src/lib/memory/ && git commit -m "feat: add memory extraction and persistence system"
```

### Task 35: Final Polish & Verification

- [ ] **Step 1: Add user creation on first login**

In the auth POST route, after creating session cookie, call `createOrUpdateUser()` with the decoded token's user info.

- [ ] **Step 2: Add toast notifications**

Import `toast` from sonner in key places:
- Login success/failure
- Account connected/disconnected
- Rate limit hit (429 response)
- Generic API errors

- [ ] **Step 3: Responsive design pass**

Verify sidebar drawer works on mobile. Verify chat input is usable on small screens. Verify account selector stacks on narrow viewports.

- [ ] **Step 4: End-to-end verification**

```bash
pnpm dev
```
Full flow: Login → New chat → Send message → See streaming response → See tool activity → Check sidebar shows conversation → Navigate to settings → Navigate to workspaces → Sign out → Verify redirect to login.

- [ ] **Step 5: Final commit**

```bash
git add -A && git commit -m "feat: final polish — user creation, toasts, responsive fixes"
```

---

## Dependency Graph

```
Task 1 (scaffold) → Task 2 (deps) → Task 3 (shadcn/env)
  → Task 4 (types)
  → Task 5 (firebase client) + Task 6 (firebase admin)
    → Task 7 (auth routes) → Task 8 (middleware) → Task 9 (auth hook) → Task 10 (login page)
    → Task 11 (root layout) → Task 12 (ui store) → Task 13-15 (layout shell)
    → Task 16-18 (firestore layer)
      → Task 19-22 (AI integration)
        → Task 24-29 (chat UI)
        → Task 23 (conversations API)
          → Task 30-32 (workspaces, settings, sidebar)
            → Task 33 (persistence) → Task 34 (memory) → Task 35 (polish)
```

Tasks within the same level can be parallelized where files don't overlap.
