import { builtInSkills } from './built-in/index';
import type { Skill } from './types';

// Firestore admin is only available server-side.
// Lazy-import it so this module can be imported in server contexts only.
async function getUserSkills(userId: string): Promise<Omit<Skill, 'source'>[]> {
  try {
    const { adminDb } = await import('@/lib/firebase/admin');
    const snap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('skills')
      .get();
    return snap.docs.map(doc => {
      const data = doc.data();
      return {
        name: data.name as string,
        description: data.description as string,
        content: data.content as string,
      };
    });
  } catch {
    return [];
  }
}

export class SkillRegistry {
  /**
   * Returns merged skill list: built-ins overridden by user skills on name collision.
   * Falls back to built-in skills only if Firestore is unavailable.
   */
  async list(userId: string): Promise<Skill[]> {
    const userRaw = await getUserSkills(userId);

    // Build map: start with built-ins, user skills override by name
    const map = new Map<string, Skill>();
    for (const s of builtInSkills) {
      map.set(s.name, { ...s, source: 'built-in' });
    }
    for (const s of userRaw) {
      map.set(s.name, { ...s, source: 'user' });
    }

    return Array.from(map.values());
  }

  /**
   * Returns a single skill by name, or null if not found.
   */
  async get(userId: string, name: string): Promise<Skill | null> {
    const all = await this.list(userId);
    return all.find(s => s.name === name) ?? null;
  }
}
