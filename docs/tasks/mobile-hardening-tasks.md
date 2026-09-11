# Tasks: Mobile Full Hardening

**Feature:** [mobile-hardening.md](../features/mobile-hardening.md)  
**Progress:** [mobile-hardening-progress.md](../progress/mobile-hardening-progress.md)

## Checklist

- [x] Docs: feature / design / progress / tasks; update offline + fluency notes
- [x] P0: shopping list snapshot-based update/remove + `markAllShoppingListChecked` + concurrent tests
- [x] P0: `expo-secure-store`, 401 handler, JWT exp, Settings logout cleanup + auth tests
- [x] P1: per-resource loading + `useMemo` provider value; skip prefs when logged out
- [x] P1: RecipeManager + Calendar use context as SoT; focus refetch
- [x] P2: AppHeader insets, root tab backs, press scale + GH root, chat KAV, Calendar FlashList, sync lock/backoff, IAP + slug
- [x] CI: `.github/workflows/mobile.yml`; run `npm run verify:strict` in `mobile/`
