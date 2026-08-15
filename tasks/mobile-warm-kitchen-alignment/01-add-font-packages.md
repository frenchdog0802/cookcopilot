# Task 01: Add Expo Google Font packages

**Phase:** 1 — Foundation  
**Depends on:** None  
**Blocks:** 03

## Description

Install bundled Fraunces and Source Sans 3 packages for Expo 54 so the app does not load fonts from the network at runtime.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/package.json` |
| Modify | `mobile/package-lock.json` (via install) |

## Implementation

From `mobile/`:

```bash
npx expo install expo-font @expo-google-fonts/fraunces @expo-google-fonts/source-sans-3
```

Use Expo-compatible versions for SDK 54.

## Acceptance criteria

- [ ] `expo-font`, `@expo-google-fonts/fraunces`, `@expo-google-fonts/source-sans-3` appear in `dependencies`
- [ ] Install completes without peer dependency errors
- [ ] No screen restyles yet (behavior unchanged)

## How to test

```bash
cd mobile && npm ls expo-font @expo-google-fonts/fraunces @expo-google-fonts/source-sans-3
```
