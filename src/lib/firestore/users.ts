import { adminDb } from "@/lib/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";

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
