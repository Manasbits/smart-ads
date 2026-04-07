import { tool } from 'ai';
import { z } from 'zod';
import type { ToolSet } from 'ai';
import type { SkillRegistry } from '@/lib/skills/registry';

export async function buildSkillTools(
  userId: string,
  registry: SkillRegistry
): Promise<ToolSet> {
  const skills = await registry.list(userId);

  // If no skills available, return empty — do NOT register the tool with an empty list
  if (skills.length === 0) return {};

  const skillNames = skills.map(s => s.name);

  return {
    activate_skill: tool({
      description:
        'Load full instructions for a named skill into context before proceeding with the task. Call this when the user requests a skill by name or when the task matches a skill description.',
      inputSchema: z.object({
        name: z
          .string()
          .refine(n => skillNames.includes(n), { message: 'Unknown skill name' })
          .describe(`The skill name to activate. Available: ${skillNames.join(', ')}`),
      }),
      execute: async ({ name }: { name: string }) => {
        const skill = await registry.get(userId, name);
        if (!skill) return `Skill "${name}" not found.`;
        return `<skill_content name="${name}">\n${skill.content}\n</skill_content>`;
      },
    }),
  };
}
