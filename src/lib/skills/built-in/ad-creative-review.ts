import type { Skill } from '../types';

export const adCreativeReviewSkill: Omit<Skill, 'source'> = {
  name: 'ad-creative-review',
  description: 'Creative performance breakdown and A/B test insights across Meta Ads.',
  content: `# Ad Creative Review

## Purpose
Analyze creative performance to identify winning creatives and inform future creative strategy.

## Steps to Follow

### 1. Fetch Ad-Level Data
- Get all active ads with spend, impressions, clicks, CTR, CPC, and conversions
- Include ad creative details (image/video, headline, body text)

### 2. Performance Ranking
- Rank ads by CTR, CPC, and conversion rate
- Identify the top 3 and bottom 3 performing creatives

### 3. Fatigue Analysis
- Flag ads with frequency > 3 as potentially fatigued
- Compare CTR trend: are high-frequency ads showing declining CTR?

### 4. A/B Insights
- Identify ad sets running multiple creatives (A/B tests)
- Declare winners based on statistical performance differences
- Recommend pausing underperformers

### 5. Creative Patterns
- What do winning creatives have in common? (format, tone, offer)
- What are losing creatives missing?

## Output Format
- Creative performance table: Ad Name | Spend | CTR | CPC | Frequency | Status
- Winner/loser summary
- Creative strategy recommendations`,
};
