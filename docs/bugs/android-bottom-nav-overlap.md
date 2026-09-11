# Bug: Android bottom nav overlapped by system navigation bar

**Status:** Resolved  
**Resolved by:** inset-aware `buildTabBarStyle` + `useSafeAreaInsets` in `MainTabs`  
**Fix design:** `docs/fixes/android-bottom-nav-overlap-fix.md`  
**RCA:** `docs/rca/android-bottom-nav-overlap-rca.md`  

---

## Current Behavior

On some Android devices (e.g. ASUS Zenfone), the app bottom tab bar is partially covered by the system gesture navigation bar or 3-button navigation bar. Tab icons/labels are clipped and the lower portion of tabs is hard or impossible to tap.

## Expected Behavior

The bottom tab bar content (icons + labels + tap targets) should sit fully above the system navigation inset on all Android navigation modes. Buttons must be fully visible and tappable.

## Reproduction Steps

1. Build/run the Expo mobile app on an Android device that uses gesture navigation or 3-button navigation (reproduced on ASUS Zenfone; likely other OEMs with non-zero bottom system insets).
2. Sign in so the main tab navigator is shown.
3. Observe the bottom tab bar relative to the system nav area.
4. Attempt to tap the lowest visible part of a tab (especially the last tab, Settings).

## Environment

- App: `mobile/` (Expo / React Native)
- OS: Android (gesture navigation and 3-button navigation)
- Devices: ASUS Zenfone (reported); other devices with `WindowInsets` bottom nav may be affected
- Related package: `@react-navigation/bottom-tabs`, `react-native-safe-area-context`

## Related Files

- `mobile/App.tsx` — `MainTabs` / `tabBarStyle` (`height: 75`, `paddingBottom: 8`)
- `mobile/package.json` — dependencies for bottom-tabs + safe-area-context
- `mobile/src/components/AppHeader.tsx` — correctly uses `useSafeAreaInsets` (contrast)
- `mobile/jest.setup.js` — mocks `useSafeAreaInsets` to zeros

## Impact Scope

- Affects authenticated users on Android devices where system bottom inset > ~0 and exceeds the hardcoded `paddingBottom: 8`.
- All main tabs (Home, Calendar, Pantry, Shopping, Recipes, Settings) share the same tab bar.
- iOS may be less impacted if React Navigation / insets were previously “close enough,” but the hardcoded height still bypasses proper inset-driven layout.

## Reproducibility Notes

- Code inspection confirms a hardcoded `tabBarStyle.height` / `paddingBottom` that does not include `insets.bottom`.
- Physical OEM device with gesture/3-button nav is the strongest confirmation; emulator may show smaller or zero insets depending on system UI settings.
- No Detox/Maestro E2E suite exists in this repo yet; unit-level style calculation can still lock the regression.

## Additional Information Needed (optional)

- Exact Android version / navigation mode on the reporting Zenfone
- Screenshot or video of overlap magnitude

## Related Documents

- `docs/features/mobile-warm-kitchen-alignment.md`
- `docs/design/mobile-warm-kitchen-alignment.md`
