# Task 01: Verify New Architecture + Hermes

**Phase:** 1 — Foundation  
**Depends on:** None  
**Blocks:** None (documentation gate)

## Description

Confirm New Architecture and Hermes remain enabled; record verification in this task’s notes / checklist. Do not flip flags off.

## Files

| Action | Path |
|--------|------|
| Read | `mobile/app.json` |
| Read | `mobile/android/gradle.properties` |

## Implementation

1. Assert `expo.newArchEnabled === true` in `app.json`.
2. Assert `newArchEnabled=true` and `hermesEnabled=true` in Android `gradle.properties`.
3. Note iOS uses Expo prebuild + `app.json` (no checked-in Podfile).

## Acceptance criteria

- [ ] Both flags confirmed true
- [ ] Checklist **01** checked when verified during implementation pass
