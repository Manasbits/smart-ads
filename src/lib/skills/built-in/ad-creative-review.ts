import type { Skill } from '../types';

export const adCreativeReviewSkill: Omit<Skill, 'source'> = {
  name: 'ad-creative-review',
  description:
    'Creative portfolio review: hook vs trust vs close assets, copy ↔ LP continuity, flexible testing, and frequency-by-day fatigue signals.',
  content: `# Ad Creative Review (SmartAds methodology)

## Purpose
Review creative like a **coach building a team**, not chasing a single unicorn ad. Map assets to **psychological jobs** in the journey. Encourage **flexible / dynamic** testing where it fits so Meta can route combinations.

## Roles to tag (conceptual)

| Role | Job | Notes |
|------|-----|-------|
| Attention / motion (often vertical video) | Earn the stop & explain *why care* | Hooks, pattern breaks, speed of idea |
| Proof / testimonial | Build trust & social proof | Faces, quotes, before/after responsibly |
| Offer / clarity (often square or static-feeling) | Crush objections & show *what it is* | Specs, stacks, price, guarantee, comparison |

An ad can blend roles; label primary + secondary when mixed.

## Steps to Follow

### 1. Pull ad-level diagnostics
Spend, impressions, outbound CTR signals (or link CTR when relevant), CPM, conversions or purchase volume, **frequency**—prefer **delivery breakdown by day** for frequency when diagnosing saturation vs fresh reach.

### 2. Rank with context
Leaderboards are fine, but annotate **spend share** and portfolio role. A modest-CTR unit may still be buying irreplaceable cheap reach.

### 3. Fatigue & quality (no single threshold)
Flag **deteriorating** performance when **frequency climbs** with **worsening CTR and/or rising CPA/CPM** over similar windows— not a magic number like 3 impressions lifetime.

### 4. Copy continuity audit
For text you can read:
- **Primary text**: strong idea in first ~125 chars; depth after "see more."
- **Headline**: tight bridge from visual to offer (short; remember some surfaces hide headlines).
- Tone & promise should **match adjacent landing sections** the user would see first.

### 5. CTA discipline
Default to standard Meta CTAs aligned to intent (Shop now, Learn more, Sign up, Apply now, etc.). Novel CTAs are rarely the unlock versus offer-creative-LP alignment.

### 6. Flexible / dynamic testing guidance
If they run single static forever, suggest **small matrices**: several hooks × a few primary texts / headlines so the system can learn pairings—align with their resources.

## Output Format

- **Coach opener** on creative bottlenecks to scale
- Markdown table: Ad | Spend | Role guess | CTR / CPM / CPA cues | Frequency (daily lens) | Verdict |
- **Two-test focus**: which weakest link creatives or copy variants to replace first  
Keep markdown-only.`,
};
