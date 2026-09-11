# Task 12: Unit tests

**Phase:** 5 — Verify  
**Depends on:** 03, 08  
**Blocks:** 13

## Description

Add unit tests for `constrainUnsplashUrl` and smoke tests for Skeleton / CachedImage; ensure Jest mocks cover FlashList and expo-image.

## Files

| Action | Path |
|--------|------|
| Add | `mobile/src/__tests__/utils/imageUrl.test.ts` |
| Add | `mobile/src/__tests__/components/Skeleton.test.tsx` (optional smoke) |
| Modify | `mobile/jest.setup.js` |

## Acceptance criteria

- [ ] `npm test` in `mobile/` passes
- [ ] imageUrl cases: unsplash w rewrite + non-unsplash passthrough
