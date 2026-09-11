# Progress: mobile-chat-first-nav

**Started:** 2026-09-08  
**Status:** Complete

| Task | Status | Notes |
|------|--------|-------|
| 01 Install drawer | done | `@react-navigation/drawer` via expo install |
| 02 MainDrawer shell | done | Chat default; no bottom tabs |
| 03 AppDrawerContent | done | Primary + Recents + New chat / Settings / Subscription |
| 04 AppHeader menu | done | `showMenuButton` + DrawerActions |
| 05 ChatEmptyState | done | Greeting, tagline, pantry/shopping counts |
| 06 Session params / pills | done | Drawer params; pills removed |
| 07 Home + CTA cleanup | done | HomeScreen + AskAiEmptyCta deleted |
| 08 i18n | done | en + zh |
| 09 Tests | done | `tsc` + 54 Jest tests pass |
| 10 Acceptance | done | Maestro flows updated for drawer |

## Acceptance (feature doc §8)

- [x] Login lands on Chat
- [x] No bottom tab bar
- [x] Hamburger opens three-layer drawer
- [x] Recents / New chat wired via Chat params
- [x] Chat empty state + HomeScreen removed
- [x] Tool screens no AI empty CTAs
- [x] Theme tokens unchanged
- [x] Maestro smoke / shopping / recipe updated
- [x] Unit/typecheck green
