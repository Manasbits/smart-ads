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
│    ...buildSkillTools(userId, registry)  ← new       │
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
│  (server-side writes only via API routes)            │
└─────────────────────────────────────────────────────┘
```

---

## Section 1: Model

**Change:** `src/lib/ai/provider.ts`

Update the default value of `process.env.LLM_MODEL` fallback from `"anthropic/claude-3.5-sonnet"` to `"anthropic/claude-sonnet-4-6"`. Do not hardcode — keep the env-var override mechanism intact so the model can still be changed without a deploy.

Extended thinking tokens stream as `reasoning` part type via AI SDK v6 — no other backend changes required.

---

## Section 2: Thinking UI + Stop Button

### ThinkingBlock component

New component: `src/components/chat/thinking-block.tsx`

**Props:**
```ts
interface ThinkingBlockProps {
  text: string;           // accumulated reasoning text
  isStreaming: boolean;   // true while part.state === 'streaming'
  startedAt: number;      // Date.now() recorded on first reasoning part arrival
}
```

The AI SDK v6 `ReasoningUIPart` has a `state` field typed as `'streaming' | 'done'`. Check `part.state === 'streaming'` to determine live vs completed state. `isStreaming` is derived in `ChatMessage` from this field and passed down.

**Streaming state (`isStreaming === true`):**
- Pulsing "Thinking..." header with animated dots
- Reasoning text streams in live below the header
- Distinct muted background to separate from the answer

**Completed state (`isStreaming === false`):**
- Collapses to a single line: `"Thought for N seconds"` where N = `Math.round((Date.now() - startedAt) / 1000)`
- `startedAt` is recorded in `ChatMessage` on first render of the reasoning part (when `part.state` first becomes `'streaming'`) and stored in a `useRef` keyed by message ID
- Expandable on click with a chevron toggle

**Placement in ChatMessage:**
Order per assistant message:
1. `ThinkingBlock` (if any reasoning part present)
2. `ToolActivity` pills (tool calls)
3. Text response (`RichMarkdown`)

### Stop button

**Change:** `src/components/chat/chat-input.tsx`

- When `status === "streaming" || status === "submitted"`: show square stop icon (`Square` from lucide-react), calls `stop()` from `useChat`
- When `status === "ready" || status === "error"`: show send arrow as before
- Input textarea stays enabled during streaming

### Status label

A single line of muted text rendered in `ChatArea` between the message list and the input bar. Derived from `status` + the parts of the last assistant message:

| Condition | Label |
|---|---|
| `status === "ready"` | *(empty)* |
| last message has a `reasoning` part with `state === 'streaming'` | `Thinking...` |
| last message has a tool part for `activate_skill` that is not yet complete | `Loading skill: {name}` |
| last message has any other tool part not yet complete | `Fetching {humanized tool name}...` |
| last message has a `text` part and `status === "streaming"` | `Responding...` |
| `status === "submitted"` | `Thinking...` |

---

## Section 3: Rich Formatting

### Mermaid diagrams

**New dep:** `mermaid`  
**New component:** `src/components/chat/mermaid-block.tsx`

- `'use client'` directive required (uses `document`)
- Loaded via `dynamic(() => import('./mermaid-block'), { ssr: false })` inside `rich-markdown.tsx` to avoid SSR crash
- Detects `language === "mermaid"` in the ReactMarkdown `code` renderer
- Calls `mermaid.render()` client-side, injects SVG into a `div`
- Initializes once with `mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' })`
- Fallback: renders raw `<pre><code>` block if `mermaid.render()` throws

### Data charts

**New dep:** `recharts`  
**New component:** `src/components/chat/chart-block.tsx`

- `'use client'` directive required (recharts uses browser APIs)
- Loaded via `dynamic(() => import('./chart-block'), { ssr: false })` inside `rich-markdown.tsx`
- Detects `language === "chart"` in the `code` renderer
- Parses JSON payload:

```json
{
  "type": "bar" | "line" | "pie",
  "title": "string",
  "data": [{ "name": "string", "value": number }],
  "xKey": "string",
  "yKey": "string"
}
```

- Renders via recharts (`BarChart`, `LineChart`, `PieChart`) with dark-themed axes and tooltips using Tailwind CSS variable colors
- Falls back to raw `<pre>` block if JSON parse fails or `type` is unrecognized

**System prompt addition (mandatory):**

`buildSystemPrompt` appends this block when the chart instruction flag is enabled (always on):

```
When you want to render a data chart, emit a fenced code block with language "chart" containing only this JSON (no extra keys):
{"type":"bar|line|pie","title":"Chart title","data":[{"name":"Label","value":123}],"xKey":"name","yKey":"value"}
Use "bar" for comparisons, "line" for time series, "pie" for share breakdowns.
```

### Table styling fix

Table prose overrides live in `rich-markdown.tsx` (not in `chat-message.tsx` after the extraction). Add `border-collapse` to the table element override and alternating `even:bg-muted/10` row shading. No new dependencies.

### RichMarkdown component

Extract the `ReactMarkdown` block from `ChatMessage` into `src/components/chat/rich-markdown.tsx`. This component:
- Is `'use client'`
- Owns all custom renderers: `pre`, `code` (with Mermaid + chart detection via dynamic imports), table overrides
- Owns all `prose-*` Tailwind class overrides (moved from `chat-message.tsx`)
- `ChatMessage` imports and uses `RichMarkdown` directly

---

## Section 4: Skills System

### Unified Skill type

```ts
// src/lib/skills/types.ts
export interface Skill {
  name: string;        // kebab-case, unique
  description: string; // one-line catalog entry (~60 tokens)
  content: string;     // full SKILL.md body (markdown)
  source: 'built-in' | 'user';
}
```

Built-in skill modules export objects satisfying `Omit<Skill, 'source'>`. The registry stamps `source` when merging.

### Built-in skills

Location: `src/lib/skills/built-in/`  
Each file exports one object of type `Omit<Skill, 'source'>`.

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
interface UserSkillDoc {
  name: string;
  description: string;
  content: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

User skills override built-in skills with the same name (user skill wins on name collision, consistent with agentskills.io project-level precedence).

**Firestore security:** No client SDK write path is used for skills. All writes go through authenticated API routes (`/api/skills`). Firestore security rules must deny all client-side writes to `users/{uid}/skills` — only server-side admin SDK writes are permitted.

### SkillRegistry

`src/lib/skills/registry.ts`

```ts
export class SkillRegistry {
  // Returns merged skill list: built-ins overridden by user skills on name collision.
  // If Firestore is unavailable, falls back to built-in skills only (logs error, does not throw).
  async list(userId: string): Promise<Skill[]>

  // Returns single skill by name. Returns null if not found.
  async get(userId: string, name: string): Promise<Skill | null>
}
```

A single `const registry = new SkillRegistry()` instance is created at the top of `/api/chat/route.ts` (module scope, reused across requests).

### `activate_skill` tool factory

Following the existing `buildMetaTools(userId)` / `buildShopifyTools(userId)` pattern, skills tools are created via a factory:

```ts
// src/lib/ai/tools/skills.ts
export async function buildSkillTools(userId: string, registry: SkillRegistry): Promise<ToolSet> {
  const skills = await registry.list(userId);

  // If no skills available, return empty set — do NOT register the tool with an empty enum
  if (skills.length === 0) return {};

  const skillNames = skills.map(s => s.name) as [string, ...string[]];

  return {
    activate_skill: tool({
      description: "Load full instructions for a named skill into context before proceeding with the task.",
      inputSchema: z.object({
        name: z.string().refine(n => skillNames.includes(n), {
          message: "Unknown skill name"
        })
      }),
      execute: async ({ name }) => {
        const skill = await registry.get(userId, name);
        if (!skill) return `Skill "${name}" not found.`;
        return `<skill_content name="${name}">\n${skill.content}\n</skill_content>`;
      }
    })
  };
}
```

**Note:** Uses `inputSchema:` (not `parameters:`), matching the AI SDK v6 `tool()` signature used throughout the existing codebase. Uses `z.string()` with `.refine()` instead of `z.enum()` to safely handle runtime-computed name lists.

The factory is called in the route alongside existing tool builders:
```ts
const [metaTools, shopifyTools, skillTools] = await Promise.all([
  buildMetaTools(userId),
  buildShopifyTools(userId),
  buildSkillTools(userId, registry),
]);
const tools = { ...metaTools, ...shopifyTools, ...skillTools };
```

### Skill catalog in system prompt

`buildSystemPrompt` accepts an optional `skills: Skill[]` parameter and appends the catalog when skills are present:

```
Available skills (call activate_skill to load full instructions before proceeding):
- campaign-audit: Deep multi-step audit of Meta Ads campaign performance...
- budget-pacing: Analyze daily/weekly spend pacing against monthly budget targets...
```

If `skills` is empty or undefined, the catalog block is omitted entirely.

### Skills management UI

New tab in `/settings` → **Skills**:

- **Built-in skills** section: read-only cards showing name + description
- **My skills** section: list of user-created skills with edit/delete
- **New skill** form: name (kebab-case input), description (single line), content (full-height markdown textarea)

> **Deferred:** "Test skill" button is out of scope for this iteration. No specification exists for it yet.

New API routes (all protected via `withAuth`):
- `GET /api/skills` — list user's skills
- `POST /api/skills` — create new skill
- `PUT /api/skills/[id]` — update skill
- `DELETE /api/skills/[id]` — delete skill

New file: `src/lib/firestore/skills.ts` — server-side admin SDK CRUD for `users/{uid}/skills`.

**Note on proxy:** `/api/skills` routes do not need to be added to `PUBLIC_PATHS` in `proxy.ts`. The proxy only redirects non-API paths for unauthenticated users; API routes return 401 via `withAuth` directly.

---

## Section 5: Slash Command Activation

### SlashCommandMenu component

New component: `src/components/chat/slash-command-menu.tsx`

**Trigger:** `/` typed at the very start of the input value (i.e. `input.startsWith('/')`)  
**UI:** popover rendered above `ChatInput`, filtered live as the user types (filter on `input.slice(1)` against skill names and descriptions — no API call)  
**Each row:** lightning icon + skill name (bold) + description (muted, truncated to one line)

**Keyboard navigation:**
- Characters after `/` live-filter the list
- `↑` / `↓` — navigate highlighted row
- `Enter` or `Tab` — select: replaces input value with `/{skill-name} ` (trailing space so user can type their question immediately)
- `Escape` — close menu, keep typed text
- Clicking outside the popover closes it

**Position:** rendered as an absolutely-positioned element above the `ChatInput` container, not in a portal (avoids z-index complexity).

Skill list fetched once via `GET /api/skills` at `ChatArea` mount (combined with the existing accounts fetch), stored in component state as `availableSkills: Skill[]`.

### Force-loaded slash activation

When the user submits a message whose `input` value starts with `/`:

1. `ChatArea.onSubmit` detects the prefix, extracts `skillName` = first token after `/`, strips it from the message text sent to the model
2. The message text (without the `/skill-name` prefix) is what goes into `sendMessage({ text })`
3. `forcedSkill: skillName` is passed via the `DefaultChatTransport` body — since the transport is rebuilt in `useMemo` when dependencies change, `ChatArea` stores `forcedSkill` in state, which is included in the transport `body` object

On the server, `/api/chat/route.ts`:
```ts
const { messages, conversationId, workspaceId, activeAccounts, forcedSkill } = body;
```

If `forcedSkill` is present and valid, prepend a synthetic completed tool call to `modelMessages` before passing to `streamText`:

```ts
if (forcedSkill) {
  const skill = await registry.get(userId, forcedSkill);
  if (skill) {
    modelMessages.unshift(
      {
        role: 'assistant',
        content: [{
          type: 'tool-call',
          toolCallId: 'forced-skill',
          toolName: 'activate_skill',
          input: { name: forcedSkill }        // 'input', not 'args' (AI SDK v6 schema)
        }]
      },
      {
        role: 'tool',
        content: [{
          type: 'tool-result',
          toolCallId: 'forced-skill',
          toolName: 'activate_skill',          // required in tool-result part
          output: {                            // 'output' with discriminator, not bare 'result'
            type: 'text',
            value: `<skill_content name="${forcedSkill}">\n${skill.content}\n</skill_content>`
          }
        }]
      }
    );
  }
}
```

This uses the AI SDK v6 `ModelMessage` shape. The model receives the skill already in context — no activation round-trip needed.

**Transport body update:** since `DefaultChatTransport` is constructed in `useMemo`, `forcedSkill` in the body must be managed as state in `ChatArea`. It is set just before `sendMessage` is called and cleared immediately after (in the same event handler), so it only affects the single in-flight request.

---

## New Files Summary

| File | Purpose |
|---|---|
| `src/lib/skills/types.ts` | `Skill` interface |
| `src/lib/skills/registry.ts` | Merges built-in + Firestore user skills |
| `src/lib/skills/built-in/*.ts` | Individual built-in skill modules (6 files) |
| `src/lib/ai/tools/skills.ts` | `buildSkillTools` factory |
| `src/components/chat/thinking-block.tsx` | Collapsible reasoning display |
| `src/components/chat/rich-markdown.tsx` | ReactMarkdown with Mermaid + chart renderers |
| `src/components/chat/mermaid-block.tsx` | Mermaid SVG renderer (`'use client'`, loaded dynamically) |
| `src/components/chat/chart-block.tsx` | recharts JSON chart renderer (`'use client'`, loaded dynamically) |
| `src/components/chat/slash-command-menu.tsx` | Skill autocomplete popover |
| `src/app/api/skills/route.ts` | GET + POST user skills |
| `src/app/api/skills/[id]/route.ts` | PUT + DELETE user skills |
| `src/lib/firestore/skills.ts` | Firestore admin SDK CRUD for user skills |

## Changed Files Summary

| File | Change |
|---|---|
| `src/lib/ai/provider.ts` | Update default model env fallback to `anthropic/claude-sonnet-4-6` |
| `src/app/api/chat/route.ts` | Add `buildSkillTools`, `forcedSkill` handling, skill catalog in prompt; instantiate `SkillRegistry` at module scope |
| `src/lib/ai/system-prompt.ts` | Accept skill list + append catalog; append chart schema instruction |
| `src/components/chat/chat-message.tsx` | Add `ThinkingBlock`, use `RichMarkdown`, track reasoning `startedAt` per message via `useRef` |
| `src/components/chat/chat-input.tsx` | Stop button (`Square` icon → `stop()`), accept `status` prop |
| `src/components/chat/chat-area.tsx` | Status label, slash command interception, `forcedSkill` state, skills fetch on mount |
| `src/app/(dashboard)/settings/page.tsx` | Add Skills tab with CRUD UI |

## New Dependencies

| Package | Purpose |
|---|---|
| `mermaid` | Client-side diagram rendering (browser-only, loaded via dynamic import) |
| `recharts` | React chart components (browser-only, loaded via dynamic import) |
