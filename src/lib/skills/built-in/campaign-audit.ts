import type { Skill } from '../types';

export const campaignAuditSkill: Omit<Skill, 'source'> = {
  name: 'campaign-audit',
  description: 'Deep multi-step audit of Meta Ads campaign performance — delivery issues, creative fatigue, audience overlap, and optimization opportunities.',
  content: `# Campaign Performance Audit

## Purpose
Perform a comprehensive, multi-step audit of Meta Ads campaign performance. Go beyond surface metrics to diagnose root causes.

## Steps to Follow

### 1. Overview
- Fetch all campaigns with status, objective, budget, and spend
- Identify campaigns with zero delivery or significant underspend

### 2. Delivery Diagnosis
- For underdelivering campaigns: check audience size, bid competition, creative status
- Flag campaigns with effective_status issues

### 3. Creative Fatigue
- Get ad-level data including frequency and CTR
- Flag ads with frequency > 3 and declining CTR as creatively fatigued
- Recommend creative refresh for fatigued ads

### 4. Audience Overlap
- Review audience targeting across ad sets
- Flag potential audience overlap between ad sets in the same campaign

### 5. Performance Benchmarks
- Compare ROAS, CPC, CPM, CTR across campaigns
- Identify top performers and bottom performers
- Calculate cost per acquisition where conversion data is available

### 6. Recommendations
- Prioritize findings by potential impact (High/Medium/Low)
- Provide specific, actionable recommendations for each issue
- Use a table to summarize: Issue | Campaign | Severity | Recommendation

## Output Format
1. Executive Summary (3-5 bullet points)
2. Detailed findings by campaign
3. Priority action table
4. Charts where helpful (use \`\`\`chart blocks for ROAS comparison, spend by campaign)`,
};
