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
