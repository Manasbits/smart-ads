import type { Skill } from '../types';

export const budgetPacingSkill: Omit<Skill, 'source'> = {
  name: 'budget-pacing',
  description:
    'Pacing versus runway + learning stability: gradual scaling guidance and when underspend signals delivery issues, not just “move budget”.',
  content: `# Budget Pacing Analysis (SmartAds methodology)

## Purpose
Help founders **stay funded long enough** to learn and **avoid self-sabotaging** the auction with frantic daily twitching. Pace checks here include **financial runway**, **auction delivery**, and **signal volume**—not only “spent vs spreadsheet.”

## Steps to Follow

### 1. Fetch budget primitives
- Active campaigns/ad sets: campaign-level vs ad-set budgets, daily vs lifetime caps, remaining budget fields when exposed
- Insights: spend for current calendar month vs last 30 days depending on billing conversation

### 2. Pace math vs month or explicit runway window
Define the measurement window the user cares about when possible (often month-to-date versus full month runway).

Calculate simple pacing ratios:
- Expected-to-date proportion = elapsed days ÷ window length  
- Pacing ratio ≈ actual spend ÷ (expected proportion × nominal budget)—flag >110% aggressive / <90% tentative with context

Explain that **steady spend is not automatically good**—must pair with satisfactory efficiency and funnel truth.

### 3. Separate calendar pacing from learning runway
If numbers look fine on paper **but CPA is noisy**:

- Hypothesize under-powered budgets per learning cell (few events per week)  
- Contrast stable **incremental ramps** (+5–10% style rhythm a few times per week mindset) versus **surfing**: huge daily chops based solely on yesterday’s mood

Coach: improving creative or conversion often unlocks efficiency **without** brute-forcing identical spend.

### 4. Overspend traps
Identify campaigns racing through lifetime caps prematurely; warn about month-end blackout risk.

### 5. Underspend diagnoses (more than reallocating)
Enumerate plausible causes—not just idle budget shifts:

| Symptom family | Typical levers |
|----------------|----------------|
| Narrow audiences / exclusions | Audience definition throttling auction |
| Creative fatigue signals | Falling outbound engagement with rising recycle |
| Cost controls too tight bid caps unreachable | Efficiency guardrails starving delivery |
| Account quality / learning resets | Repeated edits restarting exploration |

Recommend **narrowing hypotheses** tests before blindly moving dollars.

### 6. Shopify reality check when available
Rough revenue vs Meta spend deltas can reveal “platform happy / bank unhappy” pacing illusions.

## Output Format

- Short **coach opener**: what pacing question they are really answering (survival vs greed for scale).
- Markdown **pacing table**: Campaign | Window spend | Pace status | Confidence note |
- **Do this next** bullets: ramps, freezes, investigative pulls (creative, targeting breadth, bids), explicit avoid-list for panic surfing  

Keep markdown-only (tables okay).`,
};
