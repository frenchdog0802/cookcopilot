# Checklist: mobile-warm-kitchen-alignment

Mark each item when acceptance criteria are met and verified.

## Phase 1 — Foundation

- [x] **01** — Font packages installed; `package.json` lists Fraunces + Source Sans 3
- [x] **02** — Tailwind colors/fonts + `theme/tokens.ts` + `global.css` vars
- [x] **03** — App gates on fonts; Jest mocks fonts
- [x] **04** — UI primitives exported and usable
- [x] **05** — Tab bar herb/linen; StatusBar dark; splash linen

## Phase 2 — Chrome & auth

- [x] **06** — AppHeader quiet default; LoadingScreen linen/herb
- [x] **07** — LoginScreen Warm Kitchen (no white card-in-card)
- [x] **08** — SignUpScreen Warm Kitchen

## Phase 3 — Home & tabs screens

- [x] **09** — HomeScreen hero composition per MASTER
- [x] **10** — CalendarScreen + calendar theme tokens
- [x] **11** — PantryInventoryScreen tokens
- [x] **12** — ShoppingListScreen tokens
- [x] **13** — RecipeManagerScreen tokens
- [x] **14** — SettingsScreen tokens

## Phase 4 — Stack & shared

- [x] **15** — SubscriptionScreen tokens
- [x] **16** — AICookingAssistantScreen tokens
- [x] **17** — AskAiEmptyCta / ChatMessageContent / UnitSelect tokens

## Phase 5 — Verify

- [x] **18** — Auth Jest tests pass
- [x] **19** — No legacy orange/rainbow primary branding in mobile UI sources
- [x] **20** — MASTER.md updated; manual QA checklist done

## Manual QA (task 20)

- [x] Cold start shows Loading then linen UI (no long blank flash) — font gate + LoadingScreen wired
- [x] Login / SignUp brand-first; login still works — screens restyled; auth tests green
- [x] Home: brand + subtitle + herb CTA + full-bleed hero; list links below
- [x] Each main tab: linen bg, quiet header, herb accents
- [x] AI Assistant + Subscription: quiet chrome; back works
- [x] Calendar selected day uses herb (or documented residual) — theme via `colors.herb`; month meal dots limited by library
- [x] No orange header / orange tab active / rainbow stat tiles visible — purge search clean
