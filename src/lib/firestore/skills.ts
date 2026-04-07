import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface UserSkillDoc {
  name: string;
  description: string;
  content: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

function skillsCollection(userId: string) {
  return adminDb.collection('users').doc(userId).collection('skills');
}

export async function listUserSkills(userId: string): Promise<Array<UserSkillDoc & { id: string }>> {
  const snap = await skillsCollection(userId).orderBy('createdAt', 'asc').get();
  return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as UserSkillDoc) }));
}

export async function createUserSkill(
  userId: string,
  data: { name: string; description: string; content: string }
): Promise<string> {
  const ref = skillsCollection(userId).doc();
  await ref.set({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function updateUserSkill(
  userId: string,
  skillId: string,
  data: Partial<{ name: string; description: string; content: string }>
): Promise<void> {
  await skillsCollection(userId).doc(skillId).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteUserSkill(userId: string, skillId: string): Promise<void> {
  await skillsCollection(userId).doc(skillId).delete();
}
