import type { Skill } from '../types';

export const launchChecklistSkill: Omit<Skill, 'source'> = {
  name: 'launch-checklist',
  description:
    'Launch readiness: funnel truth, Pixel/events, verified domain identity, legitimacy of Page + billing, budgets for learning—not arbitrary audience scale bands.',
  content: `# Campaign Launch Readiness Checklist (SmartAds methodology)

## Purpose
Smoke-test readiness **before scaling spend confidently**. Focus on truths that unblock delivery and measurement—not legacy rules like guessing audience numeric population bands.

## Checklist Themes

### Business foundation (often checked outside Ads Manager QA)
Trust & policy survival items you should verbally confirm user completed if tools cannot verify:

- [ ] Meta **Business Manager** houses correct legal/billing identity coherence for the entity paying  
- [ ] Advertised **domains verified** inside Business Manager DNS / file methods relevant to linking websites  
- [ ] **Facebook Page (+ Instagram linkage if applicable)** looks legitimate (profile/cover/about—not empty shells)  
- [ ] Funding source added; avoid mixing personal cards into client wallets by accident

Coach: blank pages plus instant heavy spend correlate with needless review friction—not guaranteed failure, just risk.

### Data & attribution path
Using tools when connected:

- [ ] Correct **dataset / Pixel** selected for optimization event  
- [ ] Primary conversion event aligns with genuine business outcome (purchase, lead submitted, booking, etc.)  
- [ ] **Attribution settings** consciously chosen broader vs tighter click-centric windows depending on velocity of events—explain strategic trade-off, not faux moral judgment  
- [ ] Sending parameters / values when ecommerce so ROAS modeling has signal

### Structural best-practice stance (scalable baseline)
Coach alignment with playbook:

- [ ] Prefer **budget at campaign level** unless distinct offers/markets merit separation  
- [ ] Prefer **automatic placements / broad optimization** baseline (manual placement only with justification)  
- [ ] Audience definition is **geo + demographics + exclusions only as justified**—not stacked micro-interest puzzles by default  

### Landing experience
Spot-check if user supplies URL manually or via tools:

- [ ] LP loads fast/mobile-clean, repeats core promise visually near top  
- [ ] Consent/geo/purchase policy disclosures match product sensitivity (esp. subscriptions, guarantees)  
- [ ] UTMs or equivalent analytics hygiene if they rely on downstream analytics parity

### Learning sufficiency heuristic
Coach expectations:

- Estimate whether planned daily budget yields plausible **weekly event volume** versus expected cost/action; flag obviously under-funded tests that cannot exit instability.

### Ad creative package
Conceptual completeness before heavy spend ramp:

| Need | Sanity check |
|------|---------------|
| Hook asset | Attention version exists |
| Trust asset | Testimonial/review/screenshot responsibly |
| Close asset | Plain offer clarity |

### Flexible creative setup (optional enhancement)
Recommend bundling multiples if friction low: headlines/primary variants + creatives so auction can recombine efficiently.

### Policy surfaces
Reminder: Special Ad Categories, restricted vertical wording, exaggerated claims—all standard Meta policy diligence still applies beyond this checklist.

## Output Format
Walk sequentially; mark **✅ Pass | ⚠️ Needs human confirm | ❌ Blocker**.

Summarize ❌ plus ⚠️ with **coach wording** referencing why it threatens scale/clarity.

End with prioritized **launch order**: fix measurement → widen creative → stabilize budgets → gradual ramp—not instant 10×.

Keep markdown-only.`,
};
