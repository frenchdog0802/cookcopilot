# Task 17: Restyle shared components

**Phase:** 4 — Stack & shared  
**Depends on:** 02, 04  
**Blocks:** 19

## Description

Align shared mobile components with tokens so AI/empty states and inputs match Warm Kitchen.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/components/AskAiEmptyCta.tsx` |
| Modify | `mobile/src/components/ChatMessageContent.tsx` |
| Modify | `mobile/src/components/UnitSelect.tsx` |

## Implementation

Replace legacy accent colors with herb/ink/muted/line. Keep Lucide icons. Preserve component APIs.

## Acceptance criteria

- [ ] Components use Warm Kitchen tokens only for brand accents
- [ ] No API prop renames unless required
- [ ] AI empty CTA and unit select still usable

## How to test

Open screens that use these components (AI empty state, recipe/pantry unit pickers); visual smoke.
