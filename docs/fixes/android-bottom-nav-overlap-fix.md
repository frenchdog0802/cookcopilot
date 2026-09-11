# Fix Design: Android bottom nav overlapped by system navigation bar

**Bug:** `docs/bugs/android-bottom-nav-overlap.md`  
**RCA:** `docs/rca/android-bottom-nav-overlap-rca.md`  

---

## Fix Approach

Keep `@react-navigation/bottom-tabs`, keep root `SafeAreaProvider`, and make `tabBarStyle` **inset-aware**:

1. Extract a pure helper `buildTabBarStyle(insetsBottom, colors)` that computes:
   - `paddingBottom = max(insetsBottom, TAB_BAR_MIN_BOTTOM_PADDING)`
   - `height = TAB_BAR_BASE_HEIGHT + paddingBottom`  
     where `TAB_BAR_BASE_HEIGHT` preserves the previous content area (`75 - 8 = 67`).
2. In `MainTabs`, call `useSafeAreaInsets()` and pass `insets.bottom` into that helper.
3. Do **not** disable React Navigation safe area via `safeAreaInsets: { bottom: 0 }` unless we fully own padding (we will own it via the helper; avoid double-padding by relying on our explicit `paddingBottom`/`height` only).

This is the smallest correct fix: addresses the confirmed root cause without replacing the navigator or redesigning tabs.

## Alternatives Considered

| Option | Why rejected / deferred |
|--------|-------------------------|
| Remove `height` only; rely on RN defaults | May change visual density; less predictable with custom `paddingTop` |
| Wrap tab bar in `<SafeAreaView edges={['bottom']}>` via `tabBar` prop | More code; helper + insets is enough for stock tab bar |
| Hardcode a larger padding (e.g. 48) | Workaround — fails on devices with larger/smaller insets |
| Full custom tab bar component | Unnecessary scope for this bug |

## Scope of Change

- `mobile/src/navigation/tabBarStyle.ts` (new helper + constants)
- `mobile/App.tsx` — `MainTabs` uses insets + helper
- `mobile/src/__tests__/navigation/tabBarStyle.test.ts` — regression tests
- Docs: bug / rca / this fix; mark bug resolved after implementation

## Data Migration / Backfill

None.

## Rollback Plan

Revert the three file changes (helper, `App.tsx`, test). Behavior returns to fixed `height: 75`.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Tab bar taller on inset devices → less content area | Expected and correct; content already scrolls in most screens |
| Double safe-area padding | Use only our inset-based `paddingBottom`/`height`; don’t also set conflicting safeAreaInsets |
| Visual change when `insets.bottom === 0` | Helper preserves previous 75px total height |

## Regression Test Plan

1. **Unit:** Assert style height/padding for `insets.bottom` of `0`, gesture-like (`24`/`34`), and 3-button-like (`48`).
2. **Manual (device):** Zenfone / Android — gesture mode and 3-button mode; last tab (Settings) fully visible and tappable.
3. **E2E:** Repo has no Detox/Maestro. Prefer **Maestro** for this Expo app if device automation is added later; document recommendation in bug close-out. Do not add Maestro as a hard dependency in this fix unless requested.

## Confirmation that root cause is fixed

When `insets.bottom > 8`, computed `paddingBottom` and `height` increase by that inset (minus the previous fixed 8 when inset is larger). Tab content sits above the system nav region.
