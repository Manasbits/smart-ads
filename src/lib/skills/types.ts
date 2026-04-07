export interface Skill {
  name: string;        // kebab-case, unique identifier
  description: string; // one-line catalog entry used in system prompt (~60 tokens)
  content: string;     // full SKILL.md body (markdown instructions for the model)
  source: 'built-in' | 'user';
}
