# Task 06: Quiet AppHeader + LoadingScreen

**Phase:** 2 — Chrome & auth  
**Depends on:** 02  
**Blocks:** 10–16 (screens using header)

## Description

Remove default full-width orange header. Make AppHeader quiet (linen/ink). Restyle LoadingScreen to linen + herb spinner.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/components/AppHeader.tsx` |
| Modify | `mobile/src/screens/LoadingScreen.tsx` |

## Implementation

1. Change `AppHeader` default variant to quiet linen/surface; title `font-display` / ink; icons ink or muted.
2. Remove orange `primary` as brand default (delete or stop using at call sites found later — for this task, change component default + styles).
3. `LoadingScreen`: `bg-linen`, `ActivityIndicator` color `colors.herb`, muted loading text.

## Acceptance criteria

- [ ] Default header is not orange
- [ ] LoadingScreen has no orange spinner / gray-50 page bg
- [ ] Back button still calls `onBack` or `navigation.goBack()`
- [ ] Safe area / Android status padding still works

## How to test

Manual: open any screen still using AppHeader → quiet bar. Trigger auth loading → linen loader.
