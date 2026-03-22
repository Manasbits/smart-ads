import { adminDb } from "@/lib/firebase/admin";
import {
  Timestamp,
  FieldValue,
  type DocumentSnapshot,
} from "firebase-admin/firestore";
import type {
  Conversation,
  Message,
  ActiveAccountContext,
  ToolInvocation,
} from "@/types";

const conversationsRef = () => adminDb.collection("conversations");

const messagesRef = (conversationId: string) =>
  conversationsRef().doc(conversationId).collection("messages");

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function createConversation(
  userId: string,
  title: string,
  workspaceId?: string | null,
  activeAccountContext?: ActiveAccountContext
): Promise<string> {
  const now = Timestamp.now();

  const docRef = await conversationsRef().add({
    userId,
    title,
    workspaceId: workspaceId ?? null,
    status: "active",
    activeAccountContext: activeAccountContext ?? {
      metaAdsAccountId: null,
      shopifyStoreId: null,
    },
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function getConversation(
  conversationId: string,
  userId: string
): Promise<(Conversation & { id: string }) | null> {
  const doc = await conversationsRef().doc(conversationId).get();

  if (!doc.exists) return null;

  const data = doc.data()!;
  if (data.userId !== userId) return null;

  return { id: doc.id, ...data } as Conversation & { id: string };
}

export async function listConversations(
  userId: string,
  workspaceId?: string | null,
  cursor?: DocumentSnapshot,
  limit: number = 20
): Promise<{ conversations: (Conversation & { id: string })[]; lastDoc: DocumentSnapshot | null }> {
  let query = conversationsRef()
    .where("userId", "==", userId)
    .orderBy("updatedAt", "desc");

  if (workspaceId !== undefined && workspaceId !== null) {
    query = query.where("workspaceId", "==", workspaceId);
  }

  if (cursor) {
    query = query.startAfter(cursor);
  }

  query = query.limit(limit);

  const snapshot = await query.get();

  const conversations = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Conversation & { id: string }
  );

  const lastDoc =
    snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

  return { conversations, lastDoc };
}

export async function updateConversation(
  conversationId: string,
  userId: string,
  data: Partial<Omit<Conversation, "id" | "userId" | "createdAt">>
): Promise<void> {
  const doc = await conversationsRef().doc(conversationId).get();

  if (!doc.exists) {
    throw new Error("Conversation not found");
  }

  if (doc.data()!.userId !== userId) {
    throw new Error("Unauthorized: conversation does not belong to user");
  }

  await conversationsRef()
    .doc(conversationId)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

// ---------------------------------------------------------------------------
// Messages (subcollection)
// ---------------------------------------------------------------------------

export async function addMessage(
  conversationId: string,
  message: {
    role: Message["role"];
    content: string;
    toolInvocations?: ToolInvocation[];
    tokenUsage?: { prompt: number; completion: number } | null;
  }
): Promise<string> {
  const docRef = await messagesRef(conversationId).add({
    role: message.role,
    content: message.content,
    toolInvocations: message.toolInvocations ?? [],
    tokenUsage: message.tokenUsage ?? null,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

export async function getMessages(
  conversationId: string,
  cursor?: DocumentSnapshot,
  limit: number = 50
): Promise<{ messages: (Message & { id: string })[]; lastDoc: DocumentSnapshot | null }> {
  let query = messagesRef(conversationId).orderBy("createdAt", "asc");

  if (cursor) {
    query = query.startAfter(cursor);
  }

  query = query.limit(limit);

  const snapshot = await query.get();

  const messages = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Message & { id: string }
  );

  const lastDoc =
    snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

  return { messages, lastDoc };
}
