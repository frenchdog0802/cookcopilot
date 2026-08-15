# Task 10: Restyle CalendarScreen + calendar theme

**Phase:** 3 — Home & tabs screens  
**Depends on:** 02, 06  
**Blocks:** 19

## Description

Apply linen/ink/herb tokens to Calendar screen and map `react-native-calendars` theme keys per design §5.5.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/screens/CalendarScreen.tsx` |

## Implementation

1. Page `bg-linen`; quiet header/title.
2. Pass calendar `theme` using `colors` from `tokens.ts`.
3. Replace orange/gray utility classes and spinner hex.
4. If a calendar default cannot be overridden, note it in the task checklist notes / progress.md.

## Acceptance criteria

- [ ] No orange header or orange primary CTAs on this screen
- [ ] Selected/today/arrows use herb (best-effort)
- [ ] Existing calendar interactions still work

## How to test

Open Calendar tab; select days; verify theme; exercise existing add/view flows if present.
