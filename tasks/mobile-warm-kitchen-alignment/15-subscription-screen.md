# Task 15: Restyle SubscriptionScreen

**Phase:** 4 — Stack & shared  
**Depends on:** 02, 04, 06  
**Blocks:** 19

## Description

Token-align Subscription stack screen. Do not change IAP/Stripe purchase logic.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/screens/SubscriptionScreen.tsx` |

## Implementation

Quiet header with back; linen background; herb CTA for upgrade actions; muted secondary text. Visual only around existing purchase handlers.

## Acceptance criteria

- [ ] Warm Kitchen chrome and CTAs
- [ ] Purchase handlers untouched in behavior
- [ ] Back navigation works

## How to test

Navigate Settings → Subscription (or stack entry); visual check; press back.
