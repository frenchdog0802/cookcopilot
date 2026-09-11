# Progress: mobile-rn-fluency

| Task | Status | Notes |
|------|--------|-------|
| 01 | done | `app.json` + Android Gradle: newArch + Hermes true |
| 02 | done | `@shopify/flash-list` 2.0.2 + Jest mock |
| 03 | done | CachedImage, Skeleton*, listPerf, imageUrl |
| 04 | done | Shopping FlashList + ShoppingListRow memo |
| 05 | done | Pantry FlashList; ScrollView nest removed |
| 06 | done | Recipes browse FlashList; CachedImage for recipe images |
| 07 | done | AI FlashList + ChatMessageRow memo |
| 08 | done | `usePressScale` Reanimated hook |
| 09 | done | GH Pressable on ShoppingListRow |
| 10 | done | Skeleton on Shopping/Pantry/Recipes/AI/Home |
| 11 | done | Shopping local-first unchanged; pantry update rollback added |
| 12 | done | imageUrl + Skeleton/CachedImage tests pass |
| 13 | done | Acceptance signed below |

## Acceptance sign-off

- [x] Feature acceptance criteria in `docs/features/mobile-rn-fluency.md` §8 marked done after verification

### Notes

- FlashList **v2** auto-measures; no `estimatedItemSize` prop (constants kept for docs / future overrides).
- Pre-existing `api-auth.test.ts` path slash mismatch (`auth/signin` vs `/auth/signin`) remains unrelated to this feature.
