import type { Skill } from '../types';

export const shopifyCohortSkill: Omit<Skill, 'source'> = {
  name: 'shopify-cohort',
  description:
    'Cohort / LTV angles as business truth versus Meta dashboards—ties repeat revenue to prospecting-heavy vs remarketing-heavy ad strategy.',
  content: `# Shopify Customer Cohort Analysis (SmartAds methodology)

## Purpose
Use Shopify order/customer facts as **source-of-truth counterweight** to Meta attribution. Helps decide whether scaled spend should aim for efficient repeat revenue or broader cold acquisition—which Meta ROAS snapshots alone distort.

## Steps to Follow

### 1. Fetch order-linked data
Orders with timestamps, totals, currency; customer aggregates (counts, totals) for the horizon the user cares about unless they specify defaults (often last 90 days).

### 2. Segment simply
Starter segments (adjust if thin data):

- First-time purchasers vs returning (by order count thresholds)  
- Light vs heavy tails (approximate quartiles on spend contribution)

### 3. Estimate helpful economics per segment

- AOV by segment  
- Repeat purchase incidence / naive purchase frequency proxies  
- **Directional LTV heuristic** clearly labeled—not precision finance unless they supply margins:  
  Estimated LTV ≈ AOV × repeat purchase rate multiplier × hypothetical horizon-months coefficient (explain assumptions).

### 4. Concentration read
Rough Pareto view: approximate share from top cohort slice—guides whether nurture + email/SMS compounds Meta or single-shot offers dominate.

### 5. Tie back to Meta prospecting framing
Coach translation:

If most profit lives in repeat purchasers, emphasize **CPA sanity on first purchase**, post-purchase email/SMS, and beware Meta UI crediting remarketing disproportionately.  

If SKU mix is purely one-shot, acquisition CPA clarity matters more bluntly.

## Output Format

- **Coach takeaway** tying cohort shape to allowable Meta acquisition cost **philosophy**  
- Markdown **tables only** for breakdowns—no ASCII charts claiming "chart visualization" compliance with global chat markdown rules  
- Example table: Segment | Customers | Orders | Revenue | AOV | Notes |  
- **Actions**: retention tactics, creatives emphasizing subscription/repurchase if relevant, sanity checks versus Ads Manager narratives  

Keep markdown-only.`,
};
