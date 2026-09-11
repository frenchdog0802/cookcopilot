# Task 02: Install FlashList + Jest mock

**Phase:** 1 — Foundation  
**Depends on:** None  
**Blocks:** 04–07

## Description

Add `@shopify/flash-list` with Expo-compatible install and mock it in Jest as a FlatList stand-in.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/package.json` / lockfile |
| Modify | `mobile/jest.setup.js` |

## Implementation

```bash
cd mobile && npx expo install @shopify/flash-list
```

In `jest.setup.js`:

```js
jest.mock('@shopify/flash-list', () => {
  const { FlatList } = require('react-native');
  return { FlashList: FlatList };
});
```

## Acceptance criteria

- [ ] Dependency in `package.json`
- [ ] Jest mock present; existing tests still run
