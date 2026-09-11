# Task 01: Install NetInfo

**Phase:** 1 — Foundation  
**Depends on:** None  
**Blocks:** 04, 06

## Description

Add Expo-compatible `@react-native-community/netinfo` for online/offline detection.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/package.json` |
| Modify | `mobile/package-lock.json` |

## Implementation

```bash
cd mobile && npx expo install @react-native-community/netinfo
```

Mock NetInfo in `jest.setup.js` if needed for tests.

## Acceptance criteria

- [ ] Dependency listed in `mobile/package.json`
- [ ] App still starts / Jest can mock the module
