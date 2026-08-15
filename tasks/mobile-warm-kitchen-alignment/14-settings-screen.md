# Task 14: Restyle SettingsScreen

**Phase:** 3 — Home & tabs screens  
**Depends on:** 02, 04, 06  
**Blocks:** 19

## Description

Token-align Settings: linen, quiet title, list rows, herb/muted actions. Do not change logout/subscription navigation logic.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/screens/SettingsScreen.tsx` |

## Implementation

Replace gray/orange utilities; use `ListRow` where appropriate. Destructive logout may use `colors.danger` for text only.

## Acceptance criteria

- [ ] Settings looks aligned with Warm Kitchen
- [ ] Logout / navigate to Subscription still work
- [ ] No orange chrome

## How to test

Open Settings; tap subscription link if present; confirm logout still available (do not require actually logging out in automated CI).
