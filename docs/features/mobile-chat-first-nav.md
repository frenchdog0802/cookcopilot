# Feature: Mobile Chat-First Navigation (Claude-style IA)

**Status:** Implemented  
**Scope:** Mobile app only (`mobile/`) — information architecture + navigation chrome  
**Out of scope:** Web, theme restyle to Claude dark UI, backend session APIs (reuse Nest), session rename/delete UI, swipe-between-pages

**Design:** [mobile-chat-first-nav-design.md](../design/mobile-chat-first-nav-design.md)  
**Tasks:** [tasks/mobile-chat-first-nav/](../../tasks/mobile-chat-first-nav/)

---

## 1. Summary

Make **Chat** the authenticated home screen. Replace the 6-item bottom tab bar with a **left drawer** (hamburger top-left). Keep Warm Kitchen theme tokens. Merge `HomeScreen` into the Chat empty state. Surface **Recents** (chat sessions) and **+ New chat** in the drawer. Tool screens no longer deep-link into AI via empty-state CTAs.

### Locked decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | **Mobile only** | Chat-first IA is mobile UX; web unchanged |
| Theme | **Unchanged** Warm Kitchen / existing tokens | Claude IA only, not Claude skin |
| Entry | Authenticated root = **Chat** | Product is AI cooking assistant |
| Bottom tabs | **Removed** | Avoid dual nav systems |
| Top-right account | **No** | Settings live in drawer |
| Home | **Delete** / merge into Chat empty state | Home was a hub; drawer + Chat replace it |
| Drawer primary | Chat · Calendar · **Inventory** · Shopping · Recipes | User-specified order/labels |
| Drawer middle | **Recents** (session list) | Claude pattern; Nest sessions already exist |
| Drawer footer | **+ New chat** + Settings + Subscription | Sticky account/actions |
| Tool → AI CTAs | **Remove** `AskAiEmptyCta` navigations | Enter AI only via main Chat / drawer |
| Backend | **No new endpoints** | Reuse `chatApi` sessions on Nest |

### What changes

| Area | Before | After |
|------|--------|-------|
| Post-login screen | Home tab | Chat |
| Primary nav | Bottom tabs (6) | Left drawer |
| AI entry | Stack push from Home + empty CTAs | Root Chat + drawer Recents / New chat |
| Home hub | Full `HomeScreen` | Deleted; greeting/tagline/stats → Chat empty |
| Session switch | Horizontal pills on Chat | Drawer Recents (+ New chat footer) |
| Inventory label | Tab “Pantry” | Drawer “Inventory” (screen still Kitchen Inventory) |

---

## 2. Current system

### 2.1 Navigation

[`mobile/App.tsx`](../../mobile/App.tsx): root Stack → `Main` (bottom tabs) + stack `AICookingAssistant` + `Subscription`. Tabs: Home, Calendar, Pantry, Shopping, Recipes, Settings. No `@react-navigation/drawer`.

### 2.2 Chat

[`AICookingAssistantScreen.tsx`](../../mobile/src/screens/AICookingAssistantScreen.tsx) already lists/creates/switches sessions via [`chat.ts`](../../mobile/src/api/chat.ts) against Nest. Horizontal session pills + header New/Clear. Empty state = welcome message + suggested prompt chips.

### 2.3 Home / AI CTAs

[`HomeScreen.tsx`](../../mobile/src/screens/HomeScreen.tsx): hero, welcome, cook CTA, stats, shortcuts.  
`AskAiEmptyCta` on Calendar / Pantry / Shopping / Recipes empty states → `AICookingAssistant` + `initialPrompt`.

### 2.4 Sessions backend

Nest: full session CRUD. Spring: flat history only — Recents degrades when base URL points at Spring.

---

## 3. Requirements

### 3.1 Navigation

- Authenticated tree: **Drawer** as main shell (Chat default).
- Drawer routes: `Chat`, `Calendar`, `Inventory`, `Shopping`, `Recipes`, `Settings`, `Subscription`.
- Every main screen header: **hamburger** opens drawer (Chat has no back-as-exit).
- Remove bottom tab navigator and `HomeTab` / `HomeScreen`.
- Card actions that previously nested `Main` → tab names must navigate drawer routes instead.

### 3.2 Drawer content (three layers)

1. **Primary:** Chat, Calendar, Inventory, Shopping, Recipes (icon + label).
2. **Recents:** scrollable session titles from `listSessions`; tap → switch session, show Chat, close drawer.
3. **Footer (sticky):** `+ New chat` → `createSession` + welcome; Settings; Subscription.

### 3.3 Chat empty state (Home merge)

When messages are welcome-only (or new session):

- Brand / tagline (`nav.tagline` / `home.heroSubtitle`)
- Personalized greeting (`home.welcomeBack` + auth name) and/or time-aware greeting copy
- Optional light pantry/shopping counts from `pantryContext`
- Existing suggested prompts

No full Home shortcut list (drawer owns destinations). No required large hero image.

### 3.4 Remove tool → AI CTAs

Remove `AskAiEmptyCta` (or equivalent navigate-to-AI) from Calendar, Inventory, Shopping, Recipes. Empty states remain informative without pushing Chat.

### 3.5 i18n / a11y / tests

- Add `nav.inventory`, drawer/recents/newChat strings; keep zh + en.
- Hamburger and drawer items have accessibility labels / testIDs where Maestro needs them.
- Update Maestro smoke flows that assume 6 bottom tabs.

### 3.6 Auth lifecycle

- Logout: existing session clear behavior; drawer must not show prior user’s Recents after re-login (sessions are server-scoped; bootstrap reloads on Chat mount).

---

## 4. Edge cases

| Case | Expected |
|------|----------|
| Nest sessions empty | Recents empty; New chat still works |
| Spring backend (no sessions) | Recents empty / soft fail; Chat history single-thread still works |
| Tap active Recents item | Close drawer; no reload thrash |
| New chat while typing / HITL pending | Same guards as today’s New chat |
| Deep link / card → Recipes etc. | Opens drawer route, not missing tab |
| Open drawer on tool screen | Can jump to Chat without back stack maze |

---

## 5. Security

| Risk | Mitigation |
|------|------------|
| Session list exposure | Only after JWT auth; same as today |
| Cross-user Recents | Server-scoped; remount/bootstrap after login |
| No new secrets | — |

---

## 6. UX issues

| Issue | Approach |
|-------|----------|
| Tools harder to discover | Clear primary list + Inventory label |
| Session pills + Recents duplicate | Remove horizontal pills; Recents in drawer only |
| Users expect bottom AI tab | Chat is default home; hamburger discoverable |
| Empty tool screens lose Ask AI | Acceptable per product lock; enter via Chat |

---

## 7. Performance

| Issue | Approach |
|-------|----------|
| Drawer mounts all screens | Prefer lazy drawer screens (React Navigation lazy) |
| Recents refresh | Reload sessions on drawer open and after New chat |
| Chat list | Keep FlashList; empty-state is ListEmpty / welcome row only |

---

## 8. Acceptance criteria

- [x] Login lands on Chat (no Home tab).
- [x] No bottom tab bar.
- [x] Hamburger opens drawer with primary + Recents + footer (New chat, Settings, Subscription).
- [x] Recents switches sessions; New chat creates session + welcome empty state.
- [x] Chat empty state shows greeting/tagline (and optional counts); HomeScreen removed.
- [x] Tool screens do not navigate to AI via empty CTAs.
- [x] Theme tokens unchanged.
- [x] Maestro/smoke updated for drawer IA.
- [x] Unit/typecheck paths for touched nav helpers pass.

---

## 9. Related files

| Path | Relevance |
|------|-----------|
| `mobile/App.tsx` | Replace tabs with drawer |
| `mobile/src/screens/AICookingAssistantScreen.tsx` | Root Chat, empty state, session hooks |
| `mobile/src/screens/HomeScreen.tsx` | Delete |
| `mobile/src/components/AppHeader.tsx` | Hamburger |
| `mobile/src/components/AskAiEmptyCta.tsx` | Remove usages |
| `mobile/src/api/chat.ts` | Sessions |
| `mobile/src/i18n/locales/en.json`, `zh.json` | Labels |
| `mobile/.maestro/*` | E2E |

---

## 10. Open items for design phase

Resolved in design doc:

1. Drawer package / navigator shape  
2. Route name map vs old tab names  
3. Empty-state component split  
4. Session state ownership (screen vs context)  
5. Maestro selector strategy  

---

## 11. Non-goals (this version)

- Claude dark theme / visual clone  
- Web nav parity  
- Session rename/delete UI  
- Swipe gesture between tool pages  
- New Spring multi-session backend  
- Top-right profile avatar  
