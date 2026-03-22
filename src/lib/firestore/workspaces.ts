import { adminDb } from "@/lib/firebase/admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import type { Workspace, ConnectedAccount } from "@/types";

const workspacesRef = () => adminDb.collection("workspaces");

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createWorkspace(
  ownerId: string,
  name: string,
  description?: string,
  icon?: string
): Promise<string> {
  const docRef = await workspacesRef().add({
    ownerId,
    name,
    description: description ?? "",
    icon: icon ?? "",
    createdAt: Timestamp.now(),
    deletedAt: null,
    connectedAccounts: [],
  });

  return docRef.id;
}

export async function listWorkspaces(
  ownerId: string
): Promise<(Workspace & { id: string })[]> {
  const snapshot = await workspacesRef()
    .where("ownerId", "==", ownerId)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Workspace & { id: string }
  );
}

export async function getWorkspace(
  workspaceId: string,
  ownerId: string
): Promise<(Workspace & { id: string }) | null> {
  const doc = await workspacesRef().doc(workspaceId).get();

  if (!doc.exists) return null;

  const data = doc.data()!;
  if (data.ownerId !== ownerId) return null;

  return { id: doc.id, ...data } as Workspace & { id: string };
}

export async function updateWorkspace(
  workspaceId: string,
  ownerId: string,
  data: Partial<Omit<Workspace, "id" | "ownerId" | "createdAt" | "deletedAt" | "connectedAccounts">>
): Promise<void> {
  const doc = await workspacesRef().doc(workspaceId).get();

  if (!doc.exists) {
    throw new Error("Workspace not found");
  }

  if (doc.data()!.ownerId !== ownerId) {
    throw new Error("Unauthorized: workspace does not belong to user");
  }

  await workspacesRef().doc(workspaceId).update(data);
}

export async function deleteWorkspace(
  workspaceId: string,
  ownerId: string
): Promise<void> {
  const doc = await workspacesRef().doc(workspaceId).get();

  if (!doc.exists) {
    throw new Error("Workspace not found");
  }

  if (doc.data()!.ownerId !== ownerId) {
    throw new Error("Unauthorized: workspace does not belong to user");
  }

  await workspacesRef().doc(workspaceId).update({
    deletedAt: Timestamp.now(),
  });
}

// ---------------------------------------------------------------------------
// Connected Accounts
// ---------------------------------------------------------------------------

export async function addConnectedAccount(
  workspaceId: string,
  ownerId: string,
  account: ConnectedAccount
): Promise<void> {
  const doc = await workspacesRef().doc(workspaceId).get();

  if (!doc.exists) {
    throw new Error("Workspace not found");
  }

  if (doc.data()!.ownerId !== ownerId) {
    throw new Error("Unauthorized: workspace does not belong to user");
  }

  await workspacesRef()
    .doc(workspaceId)
    .update({
      connectedAccounts: FieldValue.arrayUnion(account),
    });
}

export async function removeConnectedAccount(
  workspaceId: string,
  ownerId: string,
  accountId: string
): Promise<void> {
  const doc = await workspacesRef().doc(workspaceId).get();

  if (!doc.exists) {
    throw new Error("Workspace not found");
  }

  const data = doc.data()!;
  if (data.ownerId !== ownerId) {
    throw new Error("Unauthorized: workspace does not belong to user");
  }

  const accountToRemove = (data.connectedAccounts as ConnectedAccount[]).find(
    (a) => a.accountId === accountId
  );

  if (!accountToRemove) {
    throw new Error("Connected account not found");
  }

  await workspacesRef()
    .doc(workspaceId)
    .update({
      connectedAccounts: FieldValue.arrayRemove(accountToRemove),
    });
}
