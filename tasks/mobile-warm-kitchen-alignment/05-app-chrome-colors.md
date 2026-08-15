# Task 05: Tab bar, StatusBar, splash linen

**Phase:** 1 — Foundation  
**Depends on:** 02  
**Blocks:** None (parallel with 06)

## Description

Align global chrome colors with web BottomNav: linen bar, herb active, muted inactive; dark status bar; splash background linen.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/App.tsx` (`MainTabs` `screenOptions`) |
| Modify | `mobile/App.tsx` (`StatusBar`) |
| Modify | `mobile/app.json` (splash / adaptive icon bg if trivial) |

## Implementation

1. Replace tab tint hexes with `colors` from `theme/tokens.ts` (herb / muted / linen / line).
2. Set `StatusBar` style to `dark`.
3. Update `app.json` splash `backgroundColor` to `#F3F0E8`; optionally Android adaptive icon background to the same.

Do not change tab order or which screens are registered.

## Acceptance criteria

- [ ] Active tab uses herb; inactive muted; bar linen; top border line
- [ ] Status bar content readable on linen screens
- [ ] Splash background is linen hex
- [ ] Tab navigation still reaches all existing tabs

## How to test

Manual: open app authenticated → tap each tab → confirm colors. Kill app → relaunch → splash color check.
