# SmartAds Intelligence Upgrade — Design Spec

**Date:** 2026-04-07  
**Status:** Approved  
**Scope:** Thinking UI, rich formatting, skills system

---

## Overview

Three interconnected upgrades that transform SmartAds from a basic chat interface into a Claude-like intelligent agent with visible reasoning, rich data rendering, and a domain-specific skills system.

1. **Thinking UI** — surface model reasoning, streaming status, stop button
2. **Rich Formatting** — Mermaid diagrams, recharts data charts, fixed tables
3. **Skills System** — built-in domain skills + user-created skills, auto and slash-command activation

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  ChatArea (client)                                   │
│  useChat → stream parts: text | reasoning | tool     │
│    ↓                                                 │
│  ChatMessage renders each part type:                 │
│    reasoning → ThinkingBlock (collapsible)           │
│    tool      → ToolActivity (extended)               │
│    text      → RichMarkdown (Mermaid + charts)       │
│                                                      │
│  ChatInput: stop button when streaming               │
│  SlashCommandMenu: autocomplete on /                 │
└──────────────────┬──────────────────────────────────┘
                   │ POST /api/chat
┌──────────────────▼──────────────────────────────────┐
│  /api/chat route                                     │
│  streamText with tools:                              │
│    ...metaTools, ...shopifyTools                     │
│    activate_skill(name)  ← new                       │
│                                                      │
│  system prompt includes skill catalog                │
│  buildSystemPrompt receives skill list               │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│  Skills layer  /src/lib/skills/                      │
│    built-in/   TypeScript skill modules              │
│    registry.ts merges built-in + Firestore user      │
│                                                      │
│  Firestore: users/{uid}/skills/{skillId}             │
└─────────────────────────────────────────────────────┘
```

---

## Section 1: Model

**Change:** `src/lib/ai/provider.ts`  
Switch model ID from `anthropic/claude-3.5-sonnet` to `anthropic/claude-sonnet-4-6`.  
Extended thinking tokens stream as `reasoning` part type via AI SDK v6 — no other backend changes required.

---

## Section 2: Thinking UI + Stop Button

### ThinkingBlock component

New component: `src/components/chat/thinking-block.tsx`

**Streaming state:**
- Pulsing "Thinking..." header with animated dots
- Reasoning text streams in live below the header
- Distinct muted background to separate from the answer

**Completed state:**
- Collapses to a single line: "Thought for N seconds" (estimated from reasoning token count)
- Expandable on click with a chevron toggle

**Placement in ChatMessage:**
Reasoning parts render above tool activity pills, which render above the text response. Order per message:
1. `ThinkingBlock` (if reasoning parts present)
2. `ToolActivity` pills (tool calls)
3. Text response (RichMarkdown)

### Stop button

**Change:** `src/components/chat/chat-input.tsx`

- When `status === "streaming" || status === "submitted"`: show square stop icon `■`, calls `stop()` from `useChat`
- When idle: show send arrow as today
- Input textarea stays enabled during streaming so the user can prepare their next message

### Status label

A single line of muted text rendered between the message list and the input bar, cycling through:

| State | Label |
|---|---|
| idle | *(empty)* |
| reasoning part streaming | `Thinking...` |
| activate_skill tool running | `Loading skill: {name}` |
| Meta/Shopify tool running | `Fetching {humanized tool name}...` |
| text part streaming | `Responding...` |

Derived from `status` + the last active message's streaming parts.

---

## Section 3: Rich Formatting

### Mermaid diagrams

**New dep:** `mermaid`  
**New component:** `src/components/chat/mermaid-block.tsx`

- Detects `language === "mermaid"` in the ReactMarkdown `code` renderer
- Calls `mermaid.render()` client-side, injects SVG
- Initializes with `{ theme: 'dark', securityLevel: 'loose' }`
- Fallback: raw code block if render throws

### Data charts

**New dep:** `recharts`  
**New component:** `src/components/chat/chart-block.tsx`

Detects `language === "chart"` in the `code` renderer. Expects JSON:

```json
{
  "type": "bar" | "line" | "pie",
  "title": "string",
  "data": [{ "name": "string", "value": number, ...extraKeys }],
  "xKey": "string",
  "yKey": "string"
}
```

Renders via `recharts` with dark theme tokens from Tailwind CSS vars. Supported chart types: `bar`, `line`, `pie`. Falls back to raw JSON if parse fails.

**System prompt addition:** a short instruction block in `buildSystemPrompt` describing the chart JSON schema, so the model knows how to emit charts.

### Table styling fix

**Change:** `src/components/chat/chat-message.tsx`  
Add `border-collapse` and alternating row shading to the existing `prose-table` override classes. No new dependencies.

### RichMarkdown component

Extract the `ReactMarkdown` block from `ChatMessage` into its own component `src/components/chat/rich-markdown.tsx`. This component owns all custom renderers: `pre`, `code` (with Mermaid + chart detection), and table overrides. `ChatMessage` imports `RichMarkdown`.

---

## Section 4: Skills System

### Built-in skills

Location: `src/lib/skills/built-in/`  
Each skill is a TypeScript module exporting a `BuiltInSkill` object:

```ts
interface BuiltInSkill {
  name: string;        // kebab-case, unique
  description: string; // one-line, used in catalog (~60 tokens)
  content: string;     // full SKILL.md body (markdown)
}
```

**Initial skill library:**

| Name | Description |
|---|---|
| `campaign-audit` | Deep multi-step audit of Meta Ads campaign performance — delivery, creative fatigue, audience overlap |
| `budget-pacing` | Analyze daily/weekly spend pacing against monthly budget targets with reallocation recommendations |
| `roas-optimizer` | Multi-campaign ROAS comparison and bid strategy analysis |
| `shopify-cohort` | Customer cohort analysis and LTV estimation from Shopify order data |
| `ad-creative-review` | Creative performance breakdown and A/B test insights |
| `launch-checklist` | Pre-launch validation checklist for new campaigns |

### User skills (Firestore)

Collection: `users/{uid}/skills/{skillId}`

```ts
interface UserSkill {
  name: string;
  description: string;
  content: string;  // SKILL.md body markdown
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

User skills override built-in skills with the same name (project-level precedence from agentskills.io spec).

### SkillRegistry

`src/lib/skills/registry.ts`

```ts
class SkillRegistry {
  // Returns merged skill list: built-ins + user skills (user wins on name collision)
  async list(userId: string): Promise<Skill[]>
  // Returns single skill by name
  async get(userId: string, name: string): Promise<Skill | null>
}
```

Built-in skills are statically imported. User skills are fetched from Firestore and cached per request.

### `activate_skill` tool

Added to `/api/chat/route.ts` alongside existing tools:

```ts
activate_skill: tool({
  description: "Load full instructions for a named skill into context",
  parameters: z.object({
    name: z.enum(skillNames as [string, ...string[]])
  }),
  execute: async ({ name }) => {
    const skill = await registry.get(userId, name);
    if (!skill) return `Skill "${name}" not found.`;
    return `<skill_content name="${name}">\n${skill.content}\n</skill_content>`;
  }
})
```

`skillNames` is the union of all built-in + user skill names, computed at request time.

### Skill catalog in system prompt

`buildSystemPrompt` receives the skill list and appends:

```
Available skills (call activate_skill to load full instructions before proceeding):
- campaign-audit: Deep multi-step audit of Meta Ads campaign performance...
- budget-pacing: Analyze daily/weekly spend pacing against monthly budget targets...
```

### Skills management UI

New tab in `/settings` → **Skills**:

- **Built-in skills** section: read-only cards showing name + description
- **My skills** section: list of user-created skills with edit/delete
- **New skill** form: name (kebab-case input), description (single line), content (full-height markdown textarea)
- **Test skill** button: opens a new chat with the skill pre-loaded (forced activation)

New API routes:
- `GET /api/skills` — list user skills
- `POST /api/skills` — create
- `PUT /api/skills/[id]` — update
- `DELETE /api/skills/[id]` — delete

---

## Section 5: Slash Command Activation

### SlashCommandMenu component

New component: `src/components/chat/slash-command-menu.tsx`

**Trigger:** user types `/` at the start of the input (or after whitespace)  
**UI:** popover above `ChatInput` listing skills, filtered by what follows `/`  
**Each row:** skill icon + name (bold) + description (muted, truncated)

**Keyboard navigation:**
- `↑` / `↓` — navigate
- `Enter` or `Tab` — select, appends skill name after `/`
- `Escape` — close

Skill list fetched once at `ChatArea` mount alongside connected accounts, stored in component state. No per-keystroke API calls.

### Force-loaded slash activation

When the user submits a message starting with `/skill-name`:

1. `ChatArea` detects the prefix, strips it from the display message
2. Passes `forcedSkill: "skill-name"` in the transport body
3. `/api/chat` route detects `forcedSkill`, prepends a synthetic `activate_skill` tool call + result to `modelMessages` before calling `streamText`
4. The model begins with the skill already in context — no extra round-trip, no decision step wasted

---

## New Files Summary

| File | Purpose |
|---|---|
| `src/components/chat/thinking-block.tsx` | Collapsible reasoning display |
| `src/components/chat/rich-markdown.tsx` | ReactMarkdown with Mermaid + chart renderers |
| `src/components/chat/mermaid-block.tsx` | Mermaid SVG renderer |
| `src/components/chat/chart-block.tsx` | recharts JSON chart renderer |
| `src/components/chat/slash-command-menu.tsx` | Skill autocomplete popover |
| `src/lib/skills/registry.ts` | Merges built-in + Firestore user skills |
| `src/lib/skills/built-in/*.ts` | Individual built-in skill modules |
| `src/app/api/skills/route.ts` | GET + POST user skills |
| `src/app/api/skills/[id]/route.ts` | PUT + DELETE user skills |
| `src/lib/firestore/skills.ts` | Firestore CRUD for user skills |

## Changed Files Summary

| File | Change |
|---|---|
| `src/lib/ai/provider.ts` | Switch to `anthropic/claude-sonnet-4-6` |
| `src/app/api/chat/route.ts` | Add `activate_skill` tool, `forcedSkill` handling, skill catalog in prompt |
| `src/lib/ai/system-prompt.ts` | Accept + render skill catalog + chart schema instruction |
| `src/components/chat/chat-message.tsx` | Add `ThinkingBlock`, use `RichMarkdown`, table style fix |
| `src/components/chat/chat-input.tsx` | Stop button, status label |
| `src/components/chat/chat-area.tsx` | Slash command interception, skills fetch on mount |
| `src/app/(dashboard)/settings/page.tsx` | Add Skills tab |

## New Dependencies

| Package | Purpose |
|---|---|
| `mermaid` | Client-side diagram rendering |
| `recharts` | React chart components |
