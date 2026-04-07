import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { updateUserSkill, deleteUserSkill } from '@/lib/firestore/skills';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const UpdateSkillSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9-]*$/)
    .optional(),
  description: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
});

export const PUT = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const skillId = req.nextUrl.pathname.split('/api/skills/')[1]?.split('/')[0];
    if (!skillId) return NextResponse.json({ error: 'Missing skill ID' }, { status: 400 });

    const body = await req.json();
    const parsed = UpdateSkillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    await updateUserSkill(userId, skillId, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[skills] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, { userId }) => {
  try {
    const skillId = req.nextUrl.pathname.split('/api/skills/')[1]?.split('/')[0];
    if (!skillId) return NextResponse.json({ error: 'Missing skill ID' }, { status: 400 });
    await deleteUserSkill(userId, skillId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[skills] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
});
