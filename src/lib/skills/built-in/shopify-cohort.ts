import type { Skill } from '../types';

export const shopifyCohortSkill: Omit<Skill, 'source'> = {
  name: 'shopify-cohort',
  description: 'Customer cohort analysis and LTV estimation from Shopify order data.',
  content: `# Shopify Customer Cohort Analysis

## Purpose
Analyze customer cohorts to understand retention, repeat purchase rates, and lifetime value.

## Steps to Follow

### 1. Fetch Order Data
- Get orders with customer_id, created_at, total_price for the analysis period
- Also fetch customer list with orders_count and total_spent

### 2. Segment Customers
- New customers (orders_count = 1)
- Returning customers (orders_count 2-5)
- Loyal customers (orders_count > 5)

### 3. Calculate Key Metrics
- Average Order Value (AOV) per segment
- Purchase frequency per segment
- Estimated LTV = AOV × purchase frequency × average customer lifespan
- Repeat purchase rate = returning customers / total customers

### 4. Revenue Attribution
- Revenue contribution by segment
- Identify the top 20% of customers driving 80% of revenue

## Output Format
- Cohort summary table: Segment | Count | AOV | Frequency | Est. LTV
- Revenue breakdown chart
- Recommendations for retention strategy`,
};
