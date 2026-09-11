# Feature: Mobile Full Hardening (方案 A)

**Status:** Implemented  
**Scope:** Mobile (`mobile/`) — auth security, shopping-list concurrency, context tighten, single data sources, UX/shell, CI  
**Out of scope:** Splitting `pantryContext` into multiple Providers, React Query migration, full offline for pantry/recipes/chat, backend API changes

---

## 1. Summary

Harden the Expo/RN app against known P0–P2 issues from the mobile architecture audit without a store rewrite (方案 A).

### Locked decisions

| Decision | Choice |
|----------|--------|
| Context | Keep single `pantryContext`; `useMemo` value + per-resource loading |
| JWT | `expo-secure-store` (+ one-time AsyncStorage migrate) |
| 401 | Global handler → logout; JWT `exp` check on cold start |
| Shopping writes | Snapshot-based mutations; `markAllShoppingListChecked` for Complete All |
| Recipes / Calendar | Context as source of truth |
| IAP Android IDs | `com.lardermind.pro.monthly` / `yearly` (store not configured yet) |
| CI | Root `.github/workflows/mobile.yml` → `verify:strict` |

---

## 2. Requirements (acceptance)

1. Complete All never loses items via concurrent snapshot writes.
2. JWT not stored in plain AsyncStorage after migrate.
3. Expired / 401 sessions clear to Auth stack without manual `navigation.reset`.
4. AI-created recipes appear on Recipes tab after focus/refetch.
5. Calendar reads `mealPlan`/`recipes` from context.
6. Tab root screens do not show a dead back button.
7. Shopping rows use GH Pressable + Reanimated press scale.
8. `npm run verify:strict` passes in `mobile/`.

---

## 3. Open questions

None — product decisions locked in plan review (方案 A + change IAP IDs).

---

## 4. Related docs

- [Design](../design/mobile-hardening-design.md)
- [Progress](../progress/mobile-hardening-progress.md)
- [Tasks](../tasks/mobile-hardening-tasks.md)
- Offline shopping: [feature](./offline-shopping-list.md), [design](../design/offline-shopping-list-design.md)
- Fluency: [feature](./mobile-rn-fluency.md)
