# Task 10: Skeleton on primary load paths

**Phase:** 4 — Perceived  
**Depends on:** 03, 04–07  
**Blocks:** 13

## Description

Show SkeletonList / hero skeleton while primary data or auth is loading on Shopping, Pantry, Recipes, AI, Home.

## Files

| Action | Path |
|--------|------|
| Modify | Shopping / Pantry / Recipes / AI / Home screens |
| Optional | `LoadingScreen.tsx` compose skeletons |

## Acceptance criteria

- [ ] Initial load shows structural skeleton (not spinner-only) on listed screens
- [ ] Empty list after load does not keep skeleton forever
