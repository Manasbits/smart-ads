import type { Skill } from '../types';

export const roasOptimizerSkill: Omit<Skill, 'source'> = {
  name: 'roas-optimizer',
  description: 'Multi-campaign ROAS comparison and bid strategy analysis to maximize return on ad spend.',
  content: `# ROAS Optimizer

## Purpose
Compare ROAS across campaigns and ad sets to identify optimization opportunities.

## Steps to Follow

### 1. Fetch Performance Data
- Get campaign-level insights with purchase_roas, spend, and purchase value
- Date range: last 30 days (or as specified by user)

### 2. ROAS Analysis
- Rank campaigns by ROAS (highest to lowest)
- Calculate blended account ROAS
- Identify campaigns below the account average

### 3. Bid Strategy Review
- Check bid strategy for each campaign (lowest_cost, cost_cap, bid_cap, etc.)
- Identify campaigns using inefficient bid strategies for their objective

### 4. Budget vs ROAS Correlation
- Check if budget is allocated proportionally to ROAS performance
- Identify high-ROAS campaigns that are budget-constrained

### 5. Recommendations
- Scale budget to top ROAS campaigns
- Pause or restructure campaigns with ROAS below target
- Suggest bid strategy changes where appropriate

## Output Format
- ROAS leaderboard table with budget allocation
- Keep output markdown-only with compact tables for ROAS vs spend comparison
- Specific scaling/pausing recommendations`,
};
