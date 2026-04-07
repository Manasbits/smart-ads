import type { Skill } from '../types';

export const budgetPacingSkill: Omit<Skill, 'source'> = {
  name: 'budget-pacing',
  description: 'Analyze daily/weekly spend pacing against monthly budget targets with reallocation recommendations.',
  content: `# Budget Pacing Analysis

## Purpose
Analyze how campaigns are pacing against their budget targets and recommend reallocations.

## Steps to Follow

### 1. Fetch Budget Data
- Get all active campaigns with daily_budget, lifetime_budget, and budget_remaining
- Get spend data for the current month (date_preset: this_month)

### 2. Calculate Pacing
- Days elapsed vs total days in month
- Expected spend to date = (days elapsed / total days) × monthly budget
- Actual spend to date from insights
- Pacing ratio = actual / expected (>1.1 = overpacing, <0.9 = underpacing)

### 3. Identify Issues
- Overpacing campaigns: risk of running out of budget before month end
- Underpacing campaigns: budget being wasted, delivery issues
- Calculate projected end-of-month spend for each campaign

### 4. Reallocation Recommendations
- Suggest shifting budget from underpacing to high-ROAS campaigns
- Flag campaigns that need budget increases to meet targets

## Output Format
- Pacing summary table: Campaign | Budget | Spent | Pacing % | Status
- Reallocation recommendations with specific amounts
- Use a \`\`\`chart block for spend pacing visualization`,
};
