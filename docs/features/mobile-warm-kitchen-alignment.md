# Feature: Mobile Warm Kitchen Design Alignment

**Status:** Planning  
**Scope:** Mobile app only (`mobile/`) — visual / design-system alignment with Web + Landing  
**Out of scope:** Backend APIs, business logic changes, new product features, web/landing restyles

---

## 1. Summary

Align the Expo / React Native mobile app with the **LarderMind Warm Kitchen** design system already applied to the web app and landing page.

Today mobile still uses the legacy orange / gray / rainbow-card look. Web uses herb / linen / ink tokens, Fraunces + Source Sans 3, and quieter chrome (no full-width orange headers, no rainbow stat tiles).

### What changes

| Area | Before | After |
|---|---|---|
| Design tokens | Empty `theme.extend` in `mobile/tailwind.config.js`; stock Tailwind colors | Same Warm Kitchen palette as web (`ink`, `muted`, `linen`, `surface`, `herb`, `herb-deep`, `sage`, `line`) |
| Typography | System default fonts | **Fraunces** (display / brand / titles) + **Source Sans 3** (body / UI / nav), loaded via Expo |
| App chrome | Orange `AppHeader`; white tab bar with orange active (`#f97316`) | Quiet page titles / linen surfaces; tab bar on linen with **herb** active color |
| Auth (Login / SignUp) | White card on gray; orange brand / CTA | Brand-first on linen; herb CTA; no heavy white card-in-card |
| Home | Orange header + rainbow stats + action tile grid + inset hero card | Brand + one line + primary CTA + full-bleed hero; secondary actions as simple list links |
| Other screens | Mixed gray/orange/rainbow utilities | Tokens + shared component patterns; cards only where interaction needs them |
| Shared UI layer | None | NativeWind equivalents of web utilities (btn-primary, input-field, page-title, list-row, etc.) |

### Acceptance source of truth

`frontend/design-system/lardermind/MASTER.md` (including anti-patterns).

---

## 2. Requirements

### 2.1 Design tokens (NativeWind / Tailwind)

Extend `mobile/tailwind.config.js` with the same color and font families as `frontend/tailwind.config.js`:

| Token | Hex | Usage |
|-------|-----|--------|
| `ink` | `#1F2420` | Primary text |
| `muted` | `#5E675F` | Secondary text |
| `linen` | `#F3F0E8` | Page background |
| `surface` | `#FAF8F3` | Panels / form surfaces when needed |
| `herb` | `#4F6B4A` | Accent / primary CTA |
| `herb-deep` | `#3A5238` | Pressed / active deep accent |
| `sage` | `#D8E0D0` | Selected / tint |
| `line` | `#DDD8CC` | Borders / dividers |

Fonts:

| Role | Family | Tailwind class |
|------|--------|----------------|
| Display / brand / page titles | Fraunces | `font-display` |
| Body / UI / nav | Source Sans 3 | `font-sans` (default) |

Optional: mirror CSS variables in `mobile/global.css` for documentation parity with web (`--ink`, `--herb`, etc.). NativeWind class usage remains primary.

### 2.2 Font loading

- Load **Fraunces** and **Source Sans 3** in the mobile app (Expo font pipeline — e.g. `@expo-google-fonts/*` or equivalent supported by Expo 54).
- Block or soft-gate first paint until fonts are ready (or show existing loading screen) so text does not flash system → custom.
- Map loaded fonts into Tailwind `fontFamily` so `font-display` / `font-sans` work in NativeWind.
- Fallback: system serif / sans if a weight fails to load (must still be readable).

### 2.3 Shared component utilities

Add NativeWind-friendly shared styles (in `global.css` `@layer components` and/or small reusable components) matching web intent:

| Pattern | Purpose |
|---------|---------|
| Primary button | Herb fill CTA |
| Secondary button | Outlined / quiet secondary |
| Text input | Standard field on linen/surface |
| Page title | Fraunces heading |
| Page subtitle | Muted helper under title |
| Divider | Hairline rule using `line` |
| List row | List item with bottom border |

Exact class names may follow web (`.btn-primary`, etc.) where NativeWind supports them, or thin React Native wrappers if `@apply` is unreliable on RN.

### 2.4 App chrome

#### Status bar / safe area
- Status bar style appropriate for linen backgrounds (dark content).
- Keep safe-area insets correct on iOS and Android.

#### AppHeader (`mobile/src/components/AppHeader.tsx`)
- Remove default full-width **orange** primary header.
- Default authenticated chrome: linen / transparent content area with quiet title (Fraunces), ink text, optional back affordance.
- No orange→red gradient headers.
- Back / right actions use ink or herb icons, not white-on-orange by default.

#### Bottom tabs (`mobile/App.tsx` `MainTabs`)
- Tab bar background: **linen** (not white).
- Active tint: **herb** (`#4F6B4A`).
- Inactive tint: **muted**.
- Top border: **line**.
- Icons remain Lucide (no emoji).

### 2.5 Screen-by-screen visual requirements

Scope is **full alignment** of all listed screens. Behavior and navigation stay the same unless a layout change is required by MASTER.md composition rules.

#### LoadingScreen
- Linen background; herb spinner / brand wordmark in Fraunces.

#### LoginScreen / SignUpScreen
- Brand-first on linen.
- Herb primary CTA; input fields using shared input pattern.
- No heavy white card-in-card / large shadow panel as the main auth chrome.
- Errors remain clear (may use a restrained danger red for error text only — not as brand accent).

#### HomeScreen
Per MASTER.md Home first viewport:
1. LarderMind brand (Fraunces)
2. One line: “Plan dinner from what's already in your kitchen” (or current product-equivalent copy if already localized — prefer MASTER wording unless product copy differs)
3. Primary CTA: **Cook with what I have** (herb)
4. Dominant kitchen/food image — edge-to-edge, not inset rounded card
5. Secondary actions below the fold as simple **list links** (not rainbow action tiles)

Remove:
- Rainbow stat tiles (pink/blue/red/green)
- Card-grid quick actions
- Orange header + white settings icon pattern as primary chrome

Kitchen counts (pantry / shopping) may appear below the fold in a quiet list or muted text — not multi-color stat cards.

#### CalendarScreen / PantryInventoryScreen / ShoppingListScreen / RecipeManagerScreen / SettingsScreen / SubscriptionScreen / AICookingAssistantScreen
- Page bg: linen.
- Titles: Fraunces `page-title` pattern.
- Lists: hairline dividers / list-row; avoid nested card stacks where a list suffices.
- Primary actions: herb.
- Selected / tint states: sage.
- Borders: line.
- Replace remaining orange / gray-50 / rainbow utility classes with tokens.
- Third-party widgets (e.g. `react-native-calendars`) themed as far as the library allows (selected day herb/sage; no orange defaults left visible).

#### Shared components
- `AskAiEmptyCta`, `ChatMessageContent`, `UnitSelect`: restyle to tokens; keep Lucide icons.

### 2.6 Anti-patterns (must not ship)

From MASTER.md — mobile must not retain:

- Orange→red gradients or legacy orange branding as primary accent
- Full-width orange/red headers on authenticated screens
- Rainbow stat / action tiles (pink/blue/amber/green competing accents)
- Card grids for every section
- Emoji as icons
- Multiple competing accent colors on one screen

### 2.7 Documentation / design-system status

After implementation:

- Update `frontend/design-system/lardermind/MASTER.md` **Surfaces aligned** to include Mobile app.
- Optionally add `frontend/design-system/pages/` notes for mobile-specific chrome if needed.

### 2.8 Testing

- Update existing mobile UI tests (e.g. `mobile/src/__tests__/screens/auth-screens.test.tsx`) so they still pass under new structure/copy/classes.
- Smoke-check: Login, SignUp, Home, each main tab, AI assistant, Subscription — visual + no regressions in navigation/auth.
- No requirement for screenshot snapshot suite in v1 unless already present.

---

## 3. Non-goals

- Changing API contracts, auth flows, or IAP/Stripe logic
- Redesigning product information architecture (tab set, screen inventory)
- Extracting a monorepo shared `packages/design-tokens` package (nice-to-have later; copy tokens into mobile for this feature)
- Dark mode
- Pixel-perfect web WebView parity (RN constraints OK if tokens, type, and composition rules match)

---

## 4. Edge cases

| Case | Expected handling |
|------|-------------------|
| Font load failure / offline | Fall back to system fonts; UI remains usable with correct colors |
| Font load slow | Prefer LoadingScreen / splash until ready, or brief default then swap without layout jump where possible |
| Very long page titles in AppHeader | Truncate with `numberOfLines={1}` (keep current behavior) |
| Small phones / large accessibility text | Titles and CTAs remain readable; avoid fixed heights that clip |
| Android status bar / notch | Safe area + status bar content style for linen |
| Calendar library theme limits | Best-effort token mapping; document residual library defaults if uncured |
| Error / destructive actions | Restrained red for errors/destructive only — not brand orange |
| Existing orange hex in inline `style={{}}` / icon `color` props | Replace with token hex or shared constants — classes alone are not enough |
| Image hero URL failure | Show linen fallback + CTA still available |
| Reduced motion | No new gratuitous motion; keep intentional fades only if already patterned on web |

---

## 5. Security issues

| Topic | Assessment |
|-------|------------|
| Font loading from Google / CDN at runtime | Prefer bundled Expo Google Font packages over runtime CSS `@import` URLs so the app does not depend on network for first paint and avoids extra third-party requests at launch |
| Unsplash / remote hero images | Already used; no new PII. Keep HTTPS URLs; consider bundling a local asset later (non-blocking) |
| Auth screens restyle | Must not weaken password fields (`secureTextEntry`), error handling, or token storage — visual only |
| No new secrets in repo | Do not commit `.env`; font packages are public |

**Conclusion:** Low security impact if fonts are bundled and auth behavior is untouched.

---

## 6. UX issues

| Topic | Requirement |
|-------|-------------|
| Brand consistency | Mobile must pass the same “Warm Kitchen” read as web: herb accent, linen ground, Fraunces brand |
| Home composition | First viewport = brand + one line + one CTA + dominant image — not a dashboard of cards |
| Chrome quietness | Authenticated screens use content-column titles, not loud orange bars |
| Contrast | Ink on linen and white-on-herb must meet readable contrast; muted text only for secondary |
| Touch targets | Keep ≥ ~44pt for primary controls when restyling |
| Feedback | Loading / disabled / error states remain obvious after color swap |
| Tab discoverability | Herb active state must be clearly distinct from muted inactive |

---

## 7. Performance issues

| Topic | Requirement |
|-------|-------------|
| Font bundle size | Load only needed weights (roughly 400–700 display + 300–700 body as used); avoid unused italic axes if possible |
| Startup | Font load should not add multi-second delay; reuse LoadingScreen path |
| Re-renders | Prefer className/token changes; avoid new heavy wrappers per list row |
| Images | Keep existing hero approach; do not add multiple large decorative images |
| NativeWind | Ensure `tailwind.config.js` content paths still cover `App.tsx` + `src/**`; rebuild cache if classes missing |

---

## 8. Related files

### Design source of truth
- `frontend/design-system/lardermind/MASTER.md`
- `frontend/tailwind.config.js`
- `frontend/src/index.css`
- `landing/style.css` (token parity reference)
- `frontend/src/components/BottomNav.tsx` (tab chrome reference)
- `frontend/src/components/Home.tsx` / Login (composition reference, if present under current frontend paths)

### Mobile (to change)
- `mobile/tailwind.config.js`
- `mobile/global.css`
- `mobile/App.tsx`
- `mobile/package.json` (font packages)
- `mobile/src/components/AppHeader.tsx`
- `mobile/src/components/AskAiEmptyCta.tsx`
- `mobile/src/components/ChatMessageContent.tsx`
- `mobile/src/components/UnitSelect.tsx`
- `mobile/src/screens/LoadingScreen.tsx`
- `mobile/src/screens/LoginScreen.tsx`
- `mobile/src/screens/SignUpScreen.tsx`
- `mobile/src/screens/HomeScreen.tsx`
- `mobile/src/screens/CalendarScreen.tsx`
- `mobile/src/screens/PantryInventoryScreen.tsx`
- `mobile/src/screens/ShoppingListScreen.tsx`
- `mobile/src/screens/RecipeManagerScreen.tsx`
- `mobile/src/screens/SettingsScreen.tsx`
- `mobile/src/screens/SubscriptionScreen.tsx`
- `mobile/src/screens/AICookingAssistantScreen.tsx`
- `mobile/src/__tests__/screens/auth-screens.test.tsx`

### Explicitly out of scope (unless blocked)
- Backend Java sources
- Web feature logic
- `mobile/.env*`

---

## 9. Open questions

None blocking — decisions confirmed:

1. Feature = Mobile Warm Kitchen alignment — **yes**
2. Scope = **full** screen set (A) — **yes**
3. Fonts = same as web (Fraunces + Source Sans 3) — **yes**
4. Docs path = repo convention OK — **`docs/features/` + `docs/design/`**
5. Acceptance = MASTER.md — **yes**

---

## 10. Success criteria

- [ ] Mobile Tailwind theme exposes Warm Kitchen colors + `font-display` / `font-sans`
- [ ] Fraunces + Source Sans 3 load in the app (bundled)
- [ ] No primary orange branding left in headers, tabs, or primary CTAs
- [ ] Home matches MASTER first-viewport composition (no rainbow stats / action tile grid)
- [ ] Auth is brand-first on linen with herb CTA
- [ ] All screens listed in §2.5 use linen / herb / ink tokens consistently
- [ ] Existing mobile tests pass
- [ ] MASTER.md marks mobile as aligned

---

## 11. Next step

**Step 2 — Feature Design:** generate `docs/design/mobile-warm-kitchen-alignment.md` with architecture (token port, font loading, chrome, screen mapping, risks).
