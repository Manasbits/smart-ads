import type { Skill } from '../types';

export const launchChecklistSkill: Omit<Skill, 'source'> = {
  name: 'launch-checklist',
  description: 'Pre-launch validation checklist for new Meta Ads campaigns — catches common setup mistakes before going live.',
  content: `# Campaign Launch Checklist

## Purpose
Validate a campaign before it goes live to catch common setup mistakes.

## Checklist Steps

### Campaign Level
- [ ] Objective matches the business goal (conversions vs traffic vs awareness)
- [ ] Budget is set at appropriate level for the audience size
- [ ] Campaign schedule has correct start/end dates
- [ ] Special ad category is set if required (housing, credit, employment)

### Ad Set Level
- [ ] Audience size is between 1M-10M (not too narrow, not too broad)
- [ ] No significant audience overlap with other active ad sets
- [ ] Placements are appropriate for the creative format
- [ ] Optimization event has sufficient conversion data (>50 events/week recommended)
- [ ] Bid strategy is appropriate for the campaign stage

### Ad Level
- [ ] All ad creatives are approved (no rejected creatives)
- [ ] Landing page URL is correct and loads properly
- [ ] UTM parameters are present for tracking
- [ ] Ad copy complies with Meta advertising policies
- [ ] CTA button matches the offer

### Tracking
- [ ] Meta Pixel is firing on the landing page
- [ ] Conversion events are being received
- [ ] Attribution window is set correctly

## Output Format
Go through each checklist item by fetching the relevant campaign data.
Report: ✅ Pass | ⚠️ Warning | ❌ Fail for each item.
Summarize blockers (❌) that must be fixed before launch.`,
};
