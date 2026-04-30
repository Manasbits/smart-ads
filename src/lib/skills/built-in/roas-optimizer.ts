import type { Skill } from '../types';

export const roasOptimizerSkill: Omit<Skill, 'source'> = {
  name: 'roas-optimizer',
  description:
    'ROAS and efficiency with profit volume in mind: Meta vs blended truth, then scale efficiency before raw budget jumps.',
  content: `# ROAS & Profit Efficiency (SmartAds methodology)

## Purpose
Compare return metrics **without lying to the business**. Meta ROAS is a **modeled, partial view**; **profit volume** and **bank/Shopify alignment** win long-term championships.

## Steps to Follow

### 1. Pull platform purchase metrics
Campaign (and optionally ad-set) insights: spend, attributed purchase value, Meta purchase ROAS, purchases count over last 14–30 days unless user overrides.

Normalize date windows for apples-to-apples ranking.

### 2. Blend-in reality when Shopify is connected
Rough checks:

- Order revenue momentum vs Ads spend deltas  
- New vs returning customer skew if obtainable—big Meta ROAS spikes that only harvest existing demand may mislead scale planning

Clearly label comparisons: \"Meta attributed\" vs \"Store totals\" vs \"Rough contribution guess\".

### 3. Ranking with warnings
Produce a leaderboard table—but annotate:

- Attribution window effects (campaign settings)  
- **Volume**: a killer ROAS on pocket change is trivia; double-check spend share  
- Sampling noise on low event counts  

### 4. Bid strategies and constraints
Survey cost caps, bid caps, minimum ROAS constraints if exposed. Interpret whether guards help **capital preservation** versus **auction starvation**.

### 5. Efficiency-first scaling advice
Prefer **lifting weak creative / LP conversion / offer** before heroic budget multipliers. When raising spend, recommend **gradual ramps** and watch **cost per outcome stability**—not just yesterday’s ROAS screenshot.

Explicitly warn: Meta UI can look better while bank account worsens if attribution theft from other channels happens—cross-check.

### 6. Portfolio lens
Do not tell them to starve everything except the top ROAS line item if that line item cannot absorb budget without efficiency collapse—suggest **team of ads** framing from the system prompt.

## Output Format

- **Coach summary**: what they can spend money on next week with confidence  
- Markdown **table**: Campaign | Spend | Meta ROAS | Purchases | Notes (volume & caveats)  
- **Blended commentary** if Shopify data present  
- **Actions**: creative tests, budget cadence, measurement fixes—not only “more budget to winner”  

Keep markdown-only.`,
};
