# Technical Design: Mobile Scroll Fluency

**Feature:** [mobile-scroll-fluency.md](../features/mobile-scroll-fluency.md)

## Changes

1. `listPerf.ts` — export `DRAW_DISTANCE` (250) for all hot FlashLists.
2. AI chat — gate `scrollToEnd`; `getItemType`; `drawDistance`.
3. Shopping / Pantry / Recipes / Calendar week — `drawDistance`; memo headers; stable `extraData` / `renderItem`.
4. List rows — drop per-cell Reanimated; GH `Pressable` + opacity.
5. `CachedImage` — default `transition={0}` (instant); hero can pass `transition={200}`.
6. Shopping toggles — id-based handlers via refs so `memo` skips untouched rows.
