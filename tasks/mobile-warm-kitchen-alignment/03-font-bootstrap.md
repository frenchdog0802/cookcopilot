# Task 03: Font bootstrap gate + Jest mocks

**Phase:** 1 — Foundation  
**Depends on:** 01, 02  
**Blocks:** 07+

## Description

Load Fraunces + Source Sans 3 via `useFonts` in `App.tsx`, gate first paint on font ready (or error fallback), and mock fonts in Jest so tests do not hang.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/App.tsx` |
| Modify | `mobile/jest.setup.js` |
| Modify | `mobile/tailwind.config.js` (fontFamily names if adjusted) |

## Implementation

1. Import required weights from `@expo-google-fonts/fraunces` and `@expo-google-fonts/source-sans-3` (weights listed in design §4.1).
2. Call `useFonts({ ... })` at app root; while `!fontsLoaded && !fontError`, render `LoadingScreen`.
3. On `fontError`, proceed with system fonts (still render app).
4. Ensure Tailwind `fontFamily` values match the loaded font keys.
5. Jest: mock `expo-font` and/or Google font packages so `useFonts` returns loaded immediately.

## Acceptance criteria

- [ ] App does not flash unstyled system fonts then swap without a loading path
- [ ] Font failure does not crash the app
- [ ] Jest can render components that sit under `App` providers without font network calls
- [ ] Navigation / auth behavior unchanged

## How to test

```bash
cd mobile && npm test -- --passWithNoTests
```

Manual: cold start app → LoadingScreen → main UI with custom fonts visible on brand title once later screens use `font-display`.
