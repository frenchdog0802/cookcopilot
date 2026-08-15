# Task 07: Restyle LoginScreen

**Phase:** 2 — Chrome & auth  
**Depends on:** 03, 04, 06  
**Blocks:** 18

## Description

Restyle Login to brand-first Warm Kitchen auth matching web `Login.tsx` composition. Preserve auth behavior.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/screens/LoginScreen.tsx` |

## Implementation

1. Root `bg-linen`; Fraunces brand title; muted subtitle.
2. Optional herb icon badge (ChefHat) like web.
3. Use `TextField` + `PrimaryButton`; remove large white `shadow-lg` card wrapper.
4. Error panel: sage/herb-deep or design-doc pattern — not orange/red-50 brand look (danger text OK for message).
5. Keep validation, `login()` call, navigation to SignUp, `secureTextEntry`, remember-me if present.

## Acceptance criteria

- [ ] No orange brand/CTA; herb primary button
- [ ] No heavy white card-in-card as main chrome
- [ ] Empty submit still shows validation error
- [ ] Successful login path unchanged
- [ ] Copy still includes discoverable “Sign in” / “Sign up” for tests (update tests in task 18 if needed)

## How to test

Manual login flow. Defer Jest updates to task 18 if queries break.
