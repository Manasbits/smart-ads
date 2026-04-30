import type { Skill } from '../types';

export const campaignAuditSkill: Omit<Skill, 'source'> = {
  name: 'campaign-audit',
  description:
    'Coach-style audit: Meta delivery, learning, creative portfolio, and frequency-by-day vs spend/CPM/efficiency—tied to real business outcomes.',
  content: `# Campaign Performance Audit (SmartAds methodology)

## Purpose
Walk the operator through what is really happening in their Meta account in **plain language**, with an eye toward **scalable** delivery—not one-metric hero worship. Bridge **platform numbers** to **blended outcomes** when Shopify or order data exists.

## Mindset first
Remind briefly: Ads Manager is **directional**. Pair insights with Shopify/bank-side reality where possible. Think **portfolio**: different ads/ad sets earn different jobs (reach vs efficiency); killing the worst-CPA prospecting clip can starve the funnel.

## Steps to Follow

### 1. Ground truth snapshot
- Fetch campaigns with status, objective, budget level (campaign vs ad set), spend, scheduled dates
- Note anything at zero delivery or heavy underspend (learning stalls, auctions, creatives, budgets)

### 2. Structural alignment
- Objectives versus stated business outcome (sales, leads, content)
- Prefer **budget at campaign level** (CBO aggregation) unless the structure clearly separates distinct offers or markets
- Call out unnecessary complexity—extra campaigns shrink confidence in causality

### 3. Four-metric pulse (frequency by day context)
Pull **ad-level** (or breakout) insights—use **delivery breakdown by day** for **frequency**, not lifetime averages blended across long windows when diagnosing delivery shape.
Interpret together (never one number alone):

| Lens | Typical read |
|------|----------------|
| Spend | Budget flow and prioritization inside the auction |
| CPM | Cost pressure / competition / perceived creative quality signals |
| Cost per outcome | Efficiency on the tracked event |
| **Frequency (daily)** | How often the average person sees the asset that day—a proxy for recycle vs cold reach |

**Coaching cheat sheet:** very low daily frequency paired with favorable CPM often looks like heavy cold reach allocation; materially higher frequency on the same unit often correlates with impression recycling—which can sharpen efficiency until it caps scale. Mismatches (e.g., high frequency + ugly CPM + weak efficiency) flag creative-fatigue mechanics or muddy targeting exclusions.

Avoid the outdated shorthand rule "frequency above 3 always means fatigue"; instead cite **rising frequency with deteriorating CTR / rising CPM / worsening CPA** over comparable windows.

### 4. Learning and volatility
Flag groupings trapped in frequent learning resets (edits / micro-budget starvation). Explain that unstable delivery makes scale harder—even if spikes look exciting early.

### 5. Creative and copy (portfolio—not single winner)
Summarize creatives by conceptual role where inferable:

- Attention / vertical motion (hook)
- Proof / testimonials (trust)
- Offer clarity / objections (often static-ish or square placements)

Spot **promise mismatch** versus likely landing headlines (creative promises something the LP contradicts).

### 6. Targeting breadth (coach; do not blindly decree narrow wins)
Observe whether targeting is artificially narrow (stacked interests/heavy retargeting-only spend). Explain gently: narrow can inflate short-term dashboards while capping reachable demand.

### 7. Shopify cross-check when connected
Rough directional guardrails: trending orders versus spend; obvious divergences where Meta claims wins the bank denies.

### 8. Recommendations

Prioritize Impact / Medium / Low. Speak as their coach ("here is the move"), not a generic report generator.

Use a markdown table summarizing core issues:

| Issue | Severity | Recommendation |

## Output Format

1. **Your situation in one paragraph** — what they are trying to scale and what the data broadly says  
2. **Portfolio read** — how spend distributes and what roles ads seem to serve  
3. **Four-metric narratives** referencing frequency-by-day where available  
4. **Actions** numbered in priority order  

Keep markdown-only (tables allowed). No charts or mermaid.`,
};
