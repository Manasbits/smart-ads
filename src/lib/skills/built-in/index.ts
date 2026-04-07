import { campaignAuditSkill } from './campaign-audit';
import { budgetPacingSkill } from './budget-pacing';
import { roasOptimizerSkill } from './roas-optimizer';
import { shopifyCohortSkill } from './shopify-cohort';
import { adCreativeReviewSkill } from './ad-creative-review';
import { launchChecklistSkill } from './launch-checklist';
import type { Skill } from '../types';

export const builtInSkills: Omit<Skill, 'source'>[] = [
  campaignAuditSkill,
  budgetPacingSkill,
  roasOptimizerSkill,
  shopifyCohortSkill,
  adCreativeReviewSkill,
  launchChecklistSkill,
];
