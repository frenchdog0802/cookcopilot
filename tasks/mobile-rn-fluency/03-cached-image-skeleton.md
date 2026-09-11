# Task 03: CachedImage + Skeleton + listPerf

**Phase:** 1 — Foundation  
**Depends on:** None  
**Blocks:** 04–07, 10

## Description

Add shared image wrapper, skeleton primitives, list size constants, and Unsplash URL helper.

## Files

| Action | Path |
|--------|------|
| Add | `mobile/src/constants/listPerf.ts` |
| Add | `mobile/src/components/ui/CachedImage.tsx` |
| Add | `mobile/src/components/ui/Skeleton.tsx` |
| Add | `mobile/src/utils/imageUrl.ts` |

## Implementation

Per design §2–3: `CachedImage` on `expo-image` with memory-disk cache; `Skeleton` / `SkeletonListRow` / `SkeletonList`; export estimated sizes; `constrainUnsplashUrl`.

Mock `expo-image` in Jest if missing.

## Acceptance criteria

- [ ] Components export cleanly
- [ ] Empty uri does not crash CachedImage
- [ ] Constants match design defaults
