import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/with-auth';
import { listUserSkills, createUserSkill } from '@/lib/firestore/skills';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CreateSkillSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9-]*$/, 'Name must be kebab-case (lowercase letters, numbers, hyphens)'),
  description: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
});

export const GET = withAuth(async (_req, { userId }) => {
  try {
    const skills = await listUserSkills(userId);
    return NextResponse.json({ skills });
  } catch (error) {
    console.error('[skills] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
});

export const POST = withAuth(async (req, { userId }) => {
  try {
    const body = await req.json();
    const parsed = CreateSkillSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
    }
    const id = await createUserSkill(userId, parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('[skills] POST error:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
});
