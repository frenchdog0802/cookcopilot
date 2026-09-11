# Feature: Mobile RN Fluency (Performance Playbook)

**Status:** Implemented  
**Scope:** Mobile app only (`mobile/`) — engine verification, list/image/animation/gesture performance, perceived UX (skeleton + optimistic)  
**Out of scope:** Web, new backend thumbnail CDN / image-transcoding APIs, custom C++/TurboModule workers, Redux/Zustand migration, multi-device conflict work

---

## 1. Summary

Raise React Native **scroll, animation, image, and perceived responsiveness** by moving work off the JS thread where libraries already allow it, cutting unnecessary re-renders on long lists, and replacing spinner-only loading with structural skeletons — without changing product APIs.

### Locked decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | **Mobile only** (`mobile/`) | RN stack lives here; web out of scope |
| New Architecture | **Keep enabled** (`newArchEnabled: true`) | Already on in Expo + Android Gradle |
| JS engine | **Hermes locked on** (`hermesEnabled: true`) | Already on; document + guard regressions |
| Lists | `@shopify/flash-list` v2 (auto layout; optional size hints via `listPerf` constants) + memoized row components | Cell recycling; replace FlatList on hot screens |
| Nested scroll | **Remove** ScrollView wrapping non-scrolling FlatList | Pantry / Recipes anti-pattern today |
| Animation | **Reanimated worklets** for any new / migrated motion | UI-thread; deps already present |
| Gestures | **Gesture Handler** for interactive drag/swipe (where added) | Native recognition; import already bootstrapped |
| Images | **`expo-image` wrapper** (no FastImage); client size constraints | Dep already present; unused for display |
| Backend images | **No new CDN** — shrink via URL params / display size | Avoid backend scope |
| State | **Keep Context**; high-frequency UI state stays local | No store migration; do not put scroll/input in `pantryContext` |
| Heavy compute | **No Web Worker / native TM this version** | Avoid render-path big O; defer workers |
| Optimistic UI | **Extend existing** shopping/pantry local-first patterns | Already partially shipped |
| Loading UX | **Skeleton screens** on primary list/detail loads | Replace spinner-only where structure is known |

### What changes

| Area | Before | After |
|------|--------|-------|
| Engine flags | New Arch + Hermes on, undocumented as requirement | Documented + checklist-verified; stay on |
| Shopping / AI lists | `FlatList` | `FlashList` + memo rows + `estimatedItemSize` |
| Pantry / Recipes | `ScrollView` + nested `FlatList scrollEnabled={false}` | Single scroll owner (FlashList + headers / sections) |
| Images | RN `Image` / `ImageBackground` | Shared `CachedImage` on `expo-image` |
| Motion | Little/no Reanimated usage in app code | Key transitions/press feedback via Reanimated |
| Gestures | Bootstrap only | Gesture Handler `Pressable` + Reanimated press scale on list rows (wired in mobile-hardening) |
| Loading | `ActivityIndicator` / `LoadingScreen` | Skeleton placeholders on Shopping, Pantry, Recipes, AI, Home auth-load |
| Mutations | Shopping/pantry already optimistic in places | Document + ensure toggle/check paths stay local-first with rollback |

---

## 2. Current system

### 2.1 Engine & deps

| Item | Location | Status |
|------|----------|--------|
| New Arch | `mobile/app.json` → `newArchEnabled: true`; `mobile/android/gradle.properties` → `newArchEnabled=true` | Enabled |
| Hermes | `mobile/android/gradle.properties` → `hermesEnabled=true` | Enabled |
| Reanimated | `react-native-reanimated` ~4.1.1 + babel plugin last | Installed; little app usage |
| Worklets | `react-native-worklets` | Installed (Reanimated peer) |
| Gesture Handler | `react-native-gesture-handler`; import in `mobile/index.ts` | Installed + bootstrapped |
| expo-image | `expo-image` ~3.0.11 | Installed; **not used for display** |
| FlashList | — | **Missing** |

### 2.2 Mobile surfaces (hotspots)

| File | Role | Perf issue |
|------|------|------------|
| `mobile/src/screens/ShoppingListScreen.tsx` | Primary shopping FlatList | No recycling; row not memoized |
| `mobile/src/screens/PantryInventoryScreen.tsx` | ScrollView + FlatList `scrollEnabled={false}` | Nested list anti-pattern |
| `mobile/src/screens/RecipeManagerScreen.tsx` | ScrollView + nested FlatLists | Same; recipe images via RN `Image` |
| `mobile/src/screens/AICookingAssistantScreen.tsx` | Chat FlatList | Scroll + re-render on each message |
| `mobile/src/screens/HomeScreen.tsx` | Hero `ImageBackground` (Unsplash w=1600) | Large remote bitmap; no disk/memory cache layer from expo-image |
| `mobile/src/screens/LoadingScreen.tsx` | Full-screen spinner | No structural skeleton |
| `mobile/src/contexts/pantryContext.tsx` | Domain state + optimistic shopping/pantry updates | Must not absorb scroll/search state |
| `mobile/src/components/ui/ListRow.tsx` | Shared row | Candidate for memo / gesture press |

State: Auth + Pantry **Context only** (no Redux/Zustand). Search/filter already local on Shopping.

---

## 3. Requirements

### 3.1 Engine & architecture

- Keep **New Architecture** and **Hermes** enabled for Android (Gradle) and Expo (`app.json`).
- Do not introduce JSC or disable Fabric/TurboModules in this feature.
- Document verification steps in tasks (config greps / release notes); no silent flag flips.
- Preserve Reanimated babel plugin as **last** plugin; keep Gesture Handler import first in entry.

### 3.2 Long lists (FlashList)

- Add `@shopify/flash-list` (Expo-compatible install).
- Migrate hot lists to FlashList with accurate-enough `estimatedItemSize`.
- Extract list row components and wrap with `React.memo` (stable props / callbacks).
- **ShoppingListScreen**, **PantryInventoryScreen**, **RecipeManagerScreen** (list modes), **AICookingAssistantScreen** (messages) are required migrations.
- Eliminate ScrollView → FlatList(`scrollEnabled={false}`) nesting on Pantry and Recipes: one primary virtualized list; chrome via `ListHeaderComponent` / sticky headers / section data — not double scroll.

### 3.3 Animation & gestures

- Any new continuous animation (opacity/translate/layout feedback) must use **Reanimated** (shared values / worklets), not JS `Animated` driven on the critical path for list/press polish.
- Prefer Gesture Handler touchables / gesture API for swipe-to-action or drag if introduced; do not add swipe features that fight FlashList without design.
- Minimum bar: at least one Reanimated micro-interaction on a primary list screen (e.g. press scale / check feedback) and Gesture Handler used for that interaction surface where applicable.

### 3.4 Images & memory

- Introduce a thin **`CachedImage`** (name may vary) wrapping `expo-image` with memory+disk cache, `contentFit`, and optional recycling key.
- Replace Home hero `ImageBackground` and Recipe detail/preview RN `Image` usages.
- Constrain display / request size (e.g. Unsplash `w=` closer to device width; avoid loading 1600px when view is ~390pt).
- No FastImage; no new backend image pipeline.

### 3.5 JS thread & state

- Keep scroll offset, search text, draft form fields, and ephemeral UI flags in **local component state** (or refs).
- Do not add high-frequency fields to `pantryContext` / `authContext`.
- Avoid O(n²) or full-list remaps inside `renderItem`; precompute filters with `useMemo` (already done on Shopping — preserve).
- Heavy crypto / huge array transforms: out of scope for workers this version; do not add them on the render path.

### 3.6 Perceived performance

**Skeleton**

- Add reusable Skeleton primitives (`Skeleton`, list/row variants) matching Warm Kitchen tokens.
- Use skeletons for initial load of Shopping, Pantry, Recipes list modes, AI chat bootstrap, and Home while auth initializes (replace or complement spinner).
- Prefer structure that matches final layout (rows, hero block) over indeterminate spinner alone.

**Optimistic UI**

- Preserve shopping-list offline local-first and pantry update optimistic paths.
- Check / toggle / quantity ± must remain instant; on definitive failure, rollback UI and surface error.
- Do not wait on network to flip checked state when online path already goes through local-first queue.

### 3.7 Compatibility & style

- Preserve Warm Kitchen visual language / NativeWind classes.
- Dual-backend API contract unchanged.
- Jest: mock FlashList / expo-image as needed so unit tests keep passing.

---

## 4. Edge cases

| Case | Expected behavior |
|------|-------------------|
| Empty list | Empty state (not infinite skeleton) |
| Variable-height chat rows | FlashList with reasonable `estimatedItemSize`; may overrideOverrideItemLayout if needed |
| Fast typeahead filter | Local state only; list data swaps without context thrash |
| Image URL missing / broken | Placeholder / empty; no crash |
| Offline + cached shopping | Existing offline feature still works with FlashList |
| Low-memory devices | Smaller image request sizes; expo-image cache eviction |
| Reanimated in Jest | Existing mock; new worklets covered by mock |
| Nested modals / forms on Recipes | Headers/forms outside FlashList or as ListHeader; no ScrollView+FlatList nest |

---

## 5. Security issues

| Risk | Mitigation |
|------|------------|
| Remote image URLs | Continue loading only app/trusted/user-provided recipe URLs; no arbitrary HTML |
| Logging | Do not log full image URLs with tokens if any appear |
| Cache on shared device | expo-image disk cache is non-auth data; logout still clears app auth/offline stores as today |

No new secrets. No weakening of JWT.

---

## 6. UX issues

| Issue | Approach |
|-------|----------|
| Spinner anxiety | Skeletons matching list/hero structure |
| Scroll jank on long pantry/recipes | FlashList + un-nest |
| Laggy check toggles | Keep optimistic; optional Reanimated feedback |
| Hero slow paint | Smaller Unsplash width + expo-image cache |
| Gesture vs scroll conflict | Prefer simple press feedback over aggressive swipe in v1 |

---

## 7. Performance issues

| Issue | Approach |
|-------|----------|
| Bridge / legacy arch | Keep New Arch + Hermes |
| List mount cost | Cell recycling via FlashList |
| Re-render storms | Memo rows; local high-freq state |
| JS-thread animations | Reanimated UI thread |
| Large bitmaps | expo-image + size constraints |
| Nested VirtualizedLists | Single owner scroll |

---

## 8. Acceptance criteria

- [x] `newArchEnabled` and Hermes remain true in Expo + Android Gradle configs.
- [x] `@shopify/flash-list` installed; Shopping, Pantry, Recipes (list), AI chat messages use FlashList (or documented equivalent single virtualized list).
- [x] Pantry and Recipes no longer use ScrollView wrapping `FlatList` with `scrollEnabled={false}`.
- [x] List row components for migrated screens are `React.memo`'d; row size hints documented in `listPerf` (FlashList v2 auto-measures).
- [x] `CachedImage` (expo-image) used for Home hero and recipe images previously on RN Image/ImageBackground.
- [x] Skeleton UI shown on primary load paths for Shopping, Pantry, Recipes, AI, Home auth-load.
- [x] At least one Reanimated-driven micro-interaction on a primary list screen.
- [x] Optimistic check/toggle paths remain instant with rollback on hard failure.
- [x] Scroll/search state not stored in global Context.
- [x] Unit tests pass for imageUrl / Skeleton / CachedImage; FlashList/expo-image/reanimated mocked as needed.
- [x] No new backend endpoints or image CDN.

---

## 9. Related files

| Path | Relevance |
|------|-----------|
| `mobile/app.json` | New Arch flag |
| `mobile/android/gradle.properties` | New Arch + Hermes |
| `mobile/index.ts` | Gesture Handler bootstrap |
| `mobile/babel.config.js` | Reanimated plugin |
| `mobile/package.json` | Deps |
| `mobile/src/screens/ShoppingListScreen.tsx` | FlashList + skeleton + memo |
| `mobile/src/screens/PantryInventoryScreen.tsx` | Un-nest + FlashList |
| `mobile/src/screens/RecipeManagerScreen.tsx` | Un-nest + FlashList + images |
| `mobile/src/screens/AICookingAssistantScreen.tsx` | FlashList messages |
| `mobile/src/screens/HomeScreen.tsx` | Hero image + skeleton |
| `mobile/src/screens/LoadingScreen.tsx` | May compose skeletons |
| `mobile/src/contexts/pantryContext.tsx` | Optimistic paths (touch carefully) |
| `mobile/src/components/ui/*` | Shared primitives for skeleton / image |
| `mobile/jest.setup.js` | Mocks |

---

## 10. Open items for design phase

Resolved in [`docs/design/mobile-rn-fluency-design.md`](../design/mobile-rn-fluency-design.md):

1. FlashList estimated sizes per screen → **constants per screen**
2. Recipes nested folders/recipes structure → **single FlashList with section headers in data**
3. Skeleton API shape → **`Skeleton` + `SkeletonListRow` + screen compositions**
4. Image wrapper API → **`CachedImage` over expo-image**
5. Which Reanimated micro-interaction ships in v1 → **list row press opacity/scale on Shopping check row**
6. Gesture Handler scope in v1 → **`Pressable` from gesture-handler on memoized rows**; no swipe-to-delete this version

---

## 11. Non-goals (this version)

- Backend image resizing service / CDN / AVIF pipeline
- Writing custom TurboModules or Web Workers
- Migrating Context → Redux/Zustand
- Calendar / Settings list virtualization (optional follow-up)
- Swipe-to-delete shopping items
- Forcing 120 FPS guarantees on all devices
