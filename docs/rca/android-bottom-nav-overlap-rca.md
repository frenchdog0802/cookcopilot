# RCA: Android bottom nav overlapped by system navigation bar

**Bug:** `docs/bugs/android-bottom-nav-overlap.md`  
**Status:** Confirmed via code inspection  

---

## Root Cause

`MainTabs` in `mobile/App.tsx` configures `@react-navigation/bottom-tabs` with a **fixed** `tabBarStyle`:

- `height: 75`
- `paddingBottom: 8`

Setting an absolute `height` (and a bottom padding that ignores safe-area insets) **overrides / bypasses** React Navigation’s default bottom safe-area handling. On Android devices where `useSafeAreaInsets().bottom` is larger than `8` (gesture indicator or 3-button nav), the tab content is laid out inside a box that extends into the system navigation region, so icons/labels and hit targets are clipped.

## Contributing Factors

1. **SafeAreaProvider is present** at the app root, but the tab bar never reads insets.
2. Elsewhere in the app (`AppHeader`, chat composer) correctly uses `useSafeAreaInsets()`, showing inconsistent safe-area discipline.
3. Hardcoded “looks good on my device/emulator” dimensions don’t generalize across OEM system UI inset sizes.
4. No UI regression test asserting tab bar padding includes `insets.bottom`.

## Affected Components

| Component | Role |
|-----------|------|
| `mobile/App.tsx` → `MainTabs` | Source of hardcoded `tabBarStyle` |
| All authenticated tab screens | Share the overlapping tab bar |
| `react-native-safe-area-context` | Installed and wrapping app; unused for tab bar |

## Data / State Impact

None. Pure layout/UI. No data corruption or migration needed.

## Timeline

Introduced when `MainTabs` `tabBarStyle` was styled with fixed `height` / `paddingBottom` (Warm Kitchen / navigation shell). Exact commit not required for fix; the broken pattern is present in current `App.tsx`.

## Why it wasn't caught earlier

- Emulators / devices used in development may report `insets.bottom ≈ 0` or small values under certain system UI configs.
- Automated tests mock `useSafeAreaInsets` to `{ bottom: 0 }` and do not assert tab bar geometry.
- No Detox / Maestro device E2E covering last-tab visibility on Android nav modes.

## Plausible alternatives (ranked)

1. **Most likely (confirmed):** Hardcoded `tabBarStyle.height` + `paddingBottom` without `insets.bottom` — matches code and symptom.
2. Less likely: Missing `SafeAreaProvider` — **ruled out**; provider wraps the app.
3. Less likely: Custom absolute-positioned tab bar — **ruled out**; uses `createBottomTabNavigator`.
4. Unlikely alone: OEM-only bug without app layout fault — OEM inset variance **triggers** the failure, but the app’s fixed height is the root.

## Systemic pattern?

Yes — any other absolute bottom UI that hardcodes padding without insets is at risk. Spot-check: chat composer already accounts for `insets.bottom`; tab bar did not.
