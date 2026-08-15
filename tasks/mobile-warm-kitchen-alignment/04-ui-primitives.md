# Task 04: UI primitives (Button, TextField, PageTitle)

**Phase:** 1 — Foundation  
**Depends on:** 02  
**Blocks:** 07, 08, 09+

## Description

Add thin React Native UI primitives that replace brittle web CSS `@apply` hover/focus utilities for primary actions, inputs, and titles.

## Files

| Action | Path |
|--------|------|
| Create | `mobile/src/components/ui/PrimaryButton.tsx` |
| Create | `mobile/src/components/ui/SecondaryButton.tsx` |
| Create | `mobile/src/components/ui/TextField.tsx` |
| Create | `mobile/src/components/ui/PageTitle.tsx` |
| Create | `mobile/src/components/ui/PageSubtitle.tsx` |
| Create | `mobile/src/components/ui/ListRow.tsx` |
| Create | `mobile/src/components/ui/index.ts` (barrel export) |

## Implementation

Per design §4.3:

- `PrimaryButton`: `bg-herb`, white label, pressed → `herb-deep`; optional icon + loading spinner (herb/onHerb).
- `SecondaryButton`: transparent / outlined `border-line`, `text-herb`.
- `TextField`: label + `TextInput` with `bg-surface`, `border-line`, `text-ink`, muted placeholder; support `secureTextEntry`.
- `PageTitle`: `font-display` + `text-ink`.
- `PageSubtitle`: `text-muted` sm.
- `ListRow`: pressable row with bottom `border-line`, leading icon slot, title/description, trailing chevron slot.

Do not migrate screens in this task beyond exporting components.

## Acceptance criteria

- [ ] All primitives render without crashing in isolation / Story-less smoke import
- [ ] Use tokens / Warm Kitchen classes only (no orange)
- [ ] Props match design signatures closely enough for auth/home reuse

## How to test

- Typecheck / import from a temporary test or wait for tasks 07–09.
- Optional: minimal Jest render of `PrimaryButton` with `label` + `onPress`.
