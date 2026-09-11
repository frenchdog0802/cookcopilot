# Checklist: mobile-chat-first-nav

## Phase 1 — Shell

- [x] **01** — Install `@react-navigation/drawer`
- [x] **02** — Replace bottom tabs with `MainDrawer` in `App.tsx`
- [x] **03** — Custom `AppDrawerContent` (primary + Recents + footer)

## Phase 2 — Chat UX

- [x] **04** — `AppHeader` hamburger + wire tool screens
- [x] **05** — `ChatEmptyState` (greeting / tagline / counts)
- [x] **06** — Chat handles `sessionId` / `newChat` params; remove session pills

## Phase 3 — Cleanup

- [x] **07** — Delete HomeScreen; remove AskAiEmptyCta usages; fix card navigations
- [x] **08** — i18n en/zh for inventory, recents, menu, greetings

## Phase 4 — Verify

- [x] **09** — Unit tests + `tsc` / jest green for touched code
- [x] **10** — Maestro smoke updated; acceptance sign-off in progress.md
