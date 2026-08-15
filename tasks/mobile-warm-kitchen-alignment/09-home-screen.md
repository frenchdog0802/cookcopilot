# Task 09: Restyle HomeScreen (hero composition)

**Phase:** 3 — Home & tabs screens  
**Depends on:** 04, 05, 06  
**Blocks:** 19

## Description

Rebuild Home first viewport per MASTER.md and web `Home.tsx`: brand, one line, herb CTA, full-bleed hero; below-fold counts + list links. Remove rainbow stats and action tile grid.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/screens/HomeScreen.tsx` |

## Implementation

1. Remove orange `AppHeader` as primary chrome; quiet settings icon top-right (muted).
2. Full-bleed hero (`ImageBackground` or `Image`) edge-to-edge; linen fade overlay (Views approximating `from-linen`).
3. Fraunces “LarderMind”; subtitle `Plan dinner from what's already in your kitchen`; optional welcome line; primary CTA navigates to AI with existing `initialPrompt`.
4. Below fold: muted pantry/buy counts; `ListRow` (or equivalent) for Calendar, Pantry, Shopping, Recipes.
5. Delete pink/blue/red/green stat cards and 2-column action tiles; delete inset rounded hero card pattern.

Keep data fetching (`fetchAllPantryItems`, etc.) and navigation handlers.

## Acceptance criteria

- [ ] First viewport matches MASTER composition rules
- [ ] No rainbow stat tiles or action card grid
- [ ] CTA still opens AI assistant with cook prompt
- [ ] List links navigate to correct tabs
- [ ] Settings affordance still works

## How to test

Manual on device/emulator: visual check + tap CTA and each list row.
