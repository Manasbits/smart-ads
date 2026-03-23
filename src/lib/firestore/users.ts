import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import type { UserConnectedAccount } from "@/types";

const usersRef = () => adminDb.collection("users");

export async function createOrUpdateUser(user: {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}) {
  const userDoc = usersRef().doc(user.uid);
  const existing = await userDoc.get();

  if (existing.exists) {
    await userDoc.update({ lastLoginAt: Timestamp.now() });
  } else {
    await userDoc.set({
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
      defaultWorkspaceId: null,
      settings: { theme: "dark" },
    });
  }
}

export async function getUser(userId: string) {
  const doc = await usersRef().doc(userId).get();
  if (!doc.exists) return null;
  return { uid: doc.id, ...doc.data() };
}

export async function updateUserSettings(
  userId: string,
  settings: Record<string, unknown>
) {
  await usersRef().doc(userId).update({ settings });
}

export async function addConnectedAccount(
  userId: string,
  account: Omit<UserConnectedAccount, "connectedAt">
) {
  const doc = await usersRef().doc(userId).get();
  const existing = (doc.data()?.connectedAccounts ?? []) as UserConnectedAccount[];

  // Replace existing entry for the same provider (reconnect scenario)
  const filtered = existing.filter((a) => a.provider !== account.provider);
  const updated = [
    ...filtered,
    { ...account, connectedAt: Timestamp.now() },
  ];
  await usersRef().doc(userId).update({ connectedAccounts: updated });
}

export async function removeConnectedAccount(
  userId: string,
  provider: "meta_ads" | "shopify"
) {
  const doc = await usersRef().doc(userId).get();
  if (!doc.exists) return;

  const data = doc.data();
  const accounts = (data?.connectedAccounts ?? []) as UserConnectedAccount[];
  const updated = accounts.filter((a) => a.provider !== provider);

  await usersRef().doc(userId).update({ connectedAccounts: updated });
}

export async function getConnectedAccounts(
  userId: string
): Promise<UserConnectedAccount[]> {
  const doc = await usersRef().doc(userId).get();
  if (!doc.exists) return [];
  return (doc.data()?.connectedAccounts ?? []) as UserConnectedAccount[];
}
