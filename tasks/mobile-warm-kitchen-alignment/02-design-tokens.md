# Task 02: Design tokens (Tailwind + tokens.ts + global.css)

**Phase:** 1 — Foundation  
**Depends on:** None  
**Blocks:** 04, 05, 06+

## Description

Port Warm Kitchen color and font family tokens into NativeWind config, add a TS hex module for non-className APIs, and document CSS variables in `global.css`.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/tailwind.config.js` |
| Modify | `mobile/global.css` |
| Create | `mobile/src/theme/tokens.ts` |

## Implementation

1. Extend `tailwind.config.js` with colors matching `frontend/tailwind.config.js`: `ink`, `muted`, `linen`, `surface`, `herb` / `herb.deep`, `sage`, `line`.
2. Extend `fontFamily`: `display` → Fraunces font module names; `sans` → Source Sans 3 module names (exact names must match packages from task 01 — wire names in task 03 if needed; define placeholders consistent with `@expo-google-fonts/*` exports).
3. Create `tokens.ts` with the same hex values plus `danger` and `onHerb` per design doc.
4. In `global.css`, add `:root` CSS variables for documentation parity (optional utility comments). Keep `@tailwind` imports.

Add a short comment in `tokens.ts`: keep in sync with `frontend/tailwind.config.js`.

## Acceptance criteria

- [ ] `bg-linen`, `text-ink`, `bg-herb`, `text-muted`, `border-line`, `bg-sage` resolve in NativeWind theme
- [ ] `font-display` / `font-sans` keys exist in Tailwind config
- [ ] `tokens.ts` exports typed color constants
- [ ] No UI call-site migration required in this task

## How to test

- Confirm config parses (Metro starts, or `node -e "require('./tailwind.config.js')"`).
- Import `colors` from `theme/tokens.ts` in a throwaway check or rely on TypeScript compile.
