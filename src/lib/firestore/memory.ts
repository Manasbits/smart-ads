import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { Memory } from "@/types";

const memoriesRef = () => adminDb.collection("memories");

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function saveMemory(memory: {
  userId: string;
  scope: Memory["scope"];
  scopeId: string | null;
  workspaceId: string | null;
  category: Memory["category"];
  content: string;
  source: { conversationId: string; messageId: string };
}): Promise<string> {
  const now = Timestamp.now();

  const docRef = await memoriesRef().add({
    userId: memory.userId,
    scope: memory.scope,
    scopeId: memory.scopeId,
    workspaceId: memory.workspaceId,
    category: memory.category,
    content: memory.content,
    source: memory.source,
    createdAt: now,
    updatedAt: now,
  });

  return docRef.id;
}

export async function getMemories(
  userId: string,
  scopeId?: string | null,
  category?: Memory["category"],
  limit: number = 20
): Promise<(Memory & { id: string })[]> {
  let query: FirebaseFirestore.Query = memoriesRef().where(
    "userId",
    "==",
    userId
  );

  if (scopeId !== undefined && scopeId !== null) {
    query = query.where("scopeId", "==", scopeId);
  }

  if (category) {
    query = query.where("category", "==", category);
  }

  query = query.orderBy("updatedAt", "desc").limit(limit);

  const snapshot = await query.get();

  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Memory & { id: string }
  );
}

/**
 * Finds an existing memory that is similar to the given content by checking
 * keyword overlap. Returns the first match where more than 50% of significant
 * words in `content` also appear in the existing memory, or null if none match.
 */
export async function findSimilarMemory(
  userId: string,
  scopeId: string | null,
  category: Memory["category"],
  content: string
): Promise<(Memory & { id: string }) | null> {
  let query: FirebaseFirestore.Query = memoriesRef()
    .where("userId", "==", userId)
    .where("category", "==", category);

  if (scopeId !== null) {
    query = query.where("scopeId", "==", scopeId);
  }

  const snapshot = await query.get();

  if (snapshot.empty) return null;

  const inputWords = extractKeywords(content);
  if (inputWords.size === 0) return null;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const existingWords = extractKeywords(data.content as string);

    let matchCount = 0;
    for (const word of inputWords) {
      if (existingWords.has(word)) {
        matchCount++;
      }
    }

    const overlapRatio = matchCount / inputWords.size;
    if (overlapRatio > 0.5) {
      return { id: doc.id, ...data } as Memory & { id: string };
    }
  }

  return null;
}

export async function updateMemory(
  memoryId: string,
  userId: string,
  content: string
): Promise<void> {
  const doc = await memoriesRef().doc(memoryId).get();

  if (!doc.exists) {
    throw new Error("Memory not found");
  }

  if (doc.data()!.userId !== userId) {
    throw new Error("Unauthorized: memory does not belong to user");
  }

  await memoriesRef().doc(memoryId).update({
    content,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteMemory(
  memoryId: string,
  userId: string
): Promise<void> {
  const doc = await memoriesRef().doc(memoryId).get();

  if (!doc.exists) {
    throw new Error("Memory not found");
  }

  if (doc.data()!.userId !== userId) {
    throw new Error("Unauthorized: memory does not belong to user");
  }

  await memoriesRef().doc(memoryId).delete();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extracts a set of lowercased, meaningful keywords (>= 3 chars) from text. */
function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  );
}
