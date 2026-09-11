# Feature: Offline Shopping List (Mobile)

**Status:** Implemented (with concurrency hardening — see [mobile-hardening](./mobile-hardening.md))  

**Scope:** Mobile app only (`mobile/`) — client UX + local cache + background sync against existing shopping-list APIs  
**Out of scope:** Web offline, new backend sync endpoints, multi-device conflict resolution, offline pantry/recipes/meal plans, AI chat offline

---

## 1. Summary

Enable grocery-store use of the shopping list **without network**. Users can view the last synced list and fully mutate it offline (check, add, edit quantity/unit, delete). When connectivity returns, pending mutations **auto-sync in the background** to the same `/api/shopping-list` contract used today.

### Locked decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Platform | **Mobile only** | Primary offline shopping context |
| Offline ops | **View + check/uncheck + add + edit qty/unit + delete** (A–E) | Full list usability in store |
| Sync trigger | **Automatic background sync** when online | Hands-free; no manual Sync button required as primary path |
| Conflicts | **No multi-device conflict handling** (this version) | Assume single active device; last local queue wins when flushing |
| Backend work | **None** — reuse existing CRUD APIs | Client UX + local cache only |
| API targets | **Both Spring (`backend/`) and Nest (`backend-node/`)** | Same client contract; env base URL already switches |

### What changes

| Area | Before | After |
|------|--------|-------|
| Open Shopping List offline | Network error / empty failure | Shows last cached list |
| Mutations offline | Fail or no-op | Apply immediately to local UI + cache; enqueue for sync |
| Back online | Manual refresh only | Auto flush pending queue; refresh from server |
| Connectivity UX | None | Clear offline / syncing / pending / error states |
| Delete in UI | Trash icon present but unwired | Offline-capable delete wired to remove + queue |

---

## 2. Current system

### 2.1 Backend (unchanged)

Both backends expose JWT-protected shopping list CRUD:

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/shopping-list` | List items for current user |
| `GET` | `/api/shopping-list/:id` | Single item |
| `POST` | `/api/shopping-list` | Create |
| `POST` | `/api/shopping-list/bulk` | Bulk create |
| `PUT` | `/api/shopping-list/:id` | Update quantity / unit / checked |
| `DELETE` | `/api/shopping-list/:id` | Delete |

Item fields (logical): `id`, `ingredient_id` / name, `quantity`, `unit`, `checked`, pantry flags, timestamps.

Mobile already points at either backend via `EXPO_PUBLIC_API_BASE_URL` (`mobile/src/api/client.ts`). Payload shaping lives in `mobile/src/api/shoppingList.ts` and must remain compatible with **both** Spring and Nest response envelopes (`ApiResponse` + parse helpers).

### 2.2 Mobile today

| File | Role |
|------|------|
| `mobile/src/screens/ShoppingListScreen.tsx` | UI: search, add form, check, qty ±, complete-all; delete UI not hooked |
| `mobile/src/contexts/pantryContext.tsx` | `fetchAllShoppingListItems`, `add` / `update` / `remove` — network-first, in-memory only |
| `mobile/src/api/shoppingList.ts` | REST client + DTO parse |
| `mobile/src/api/client.ts` | `fetch` + JWT from AsyncStorage; network failures → `{ success: false, message: 'Network error…' }` |

There is **no** offline cache, mutation queue, or connectivity awareness for shopping list (AsyncStorage is used for JWT only). No `@react-native-community/netinfo` dependency yet.

---

## 3. Requirements

### 3.1 Local cache (read path)

- Persist the user’s shopping list snapshot locally (AsyncStorage or equivalent durable store already used on mobile).
- On app open / Shopping screen mount:
  1. Render from **local cache immediately** (if present).
  2. If online, fetch server list and **replace** cache + UI.
  3. If offline or fetch fails with network error, keep showing cache (do not wipe list).
- Cache is **per authenticated user** (key includes user id or clear on logout / user switch).
- Empty cache + offline → empty state with offline messaging (not a hard error).

### 3.2 Offline mutations (write path)

While offline (or when a request fails as network error), the following must still work against local state + cache:

| Op | Behavior |
|----|----------|
| View / search | Against local list |
| Check / uncheck | Optimistic local update; enqueue `UPDATE` |
| Add item | Create **local temp id**; enqueue `CREATE`; show in list immediately |
| Edit quantity / unit | Optimistic local update; enqueue `UPDATE` (or coalesce with prior pending update for same id) |
| Delete | Remove from local list; enqueue `DELETE` (cancel pending create if never synced) |
| Complete all | Same as N check updates (or batched local + queued updates) |

Rules:

- UI must not block on network for these ops when offline.
- Pending ops survive app kill / restart until successfully synced.
- Coalesce / collapse redundant queue entries where safe (e.g. multiple qty changes → one UPDATE; create-then-delete → drop both).

### 3.3 Background sync

- Detect online/offline (NetInfo or equivalent).
- When transitioning **offline → online**, and periodically while online if queue non-empty, **automatically** flush the mutation queue FIFO (with coalescing applied).
- Map local temp ids to server ids after successful `CREATE`; rewrite subsequent queued ops that referenced the temp id.
- After successful flush (or per-op success), refresh list from server and overwrite cache (single-device assumption: server becomes source of truth post-sync).
- On partial failure (non-network 4xx/5xx): keep failed op(s), surface recoverable error UX, do not silently drop.
- On network failure mid-flush: stop, remain pending, retry on next online event / backoff.

No new sync API — flush uses existing create / update / delete endpoints only.

### 3.4 Dual-backend compatibility

- Continue using current mobile API client + parsers so switching `EXPO_PUBLIC_API_BASE_URL` between Spring `:8080` and Nest `:8090`/`:8081` keeps offline + sync working.
- Do **not** introduce Nest-only or Spring-only request shapes for this feature.
- Acceptance: smoke offline→online flush against **both** backends (or documented parity checklist if one env unavailable in CI).

### 3.5 UX

| State | User-visible signal |
|-------|---------------------|
| Offline | Non-blocking banner/chip: offline; edits saved on device |
| Pending sync | Subtle “pending / syncing…” when queue length > 0 |
| Sync success | Optional brief confirmation; pending indicator clears |
| Sync failure | Clear message + automatic retry later; list stays usable |
| First launch never online | Empty + offline guidance |

- Optimistic UI: check/add/edit/delete feel instant.
- Do not require a primary manual Sync button; optional secondary “Retry sync” when failed is allowed.
- Preserve Warm Kitchen tokens / existing shopping screen patterns.
- Wire delete control to `removeShoppingListItem` (offline-aware).

### 3.6 Auth & lifecycle

- Require logged-in user (JWT already required for API).
- On logout: clear shopping list cache + mutation queue for that user (no cross-user leak).
- On login as different user: never show previous user’s cached list.

---

## 4. Edge cases

| Case | Expected behavior |
|------|-------------------|
| Never fetched, open offline | Empty list + offline empty state |
| Cached list, offline edits, app killed | Restore list + pending queue; resume sync when online |
| Create offline then delete before sync | Queue collapses; no server create |
| Create offline, sync succeeds | Temp id replaced by server id; UI stable |
| Update offline on server-known id | Flush as `PUT` |
| Complete-all offline | All unchecked → checked locally; queue updates (coalesced) |
| Online fetch fails mid-session | Keep current local/cache; show soft error; do not clear list |
| Server returns 401 during sync | Stop flush; existing auth handling (re-login); do not wipe local pending until policy decided — prefer keep pending and surface auth error |
| Server 404 on update/delete (item gone) | Drop that queue entry; refresh from server; no crash |
| Huge queue / rapid taps | Coalesce; avoid duplicate spam requests |
| Switch user | Cache/queue isolated or cleared |
| Airplane mode toggle | Auto sync starts shortly after connectivity restored |
| Ingredients catalog offline for new item name | Allow free-text name create (existing API accepts name); unit may use last known / user-entered unit |

---

## 5. Security issues

| Risk | Mitigation |
|------|------------|
| Cached list on shared device | Clear cache + queue on logout; prefer user-scoped keys |
| Stale JWT used when back online | Existing 401 path; do not sync with empty token |
| Local storage tampering | Treat cache as untrusted UI data; server remains authority after sync; no privilege escalation (still need JWT for API) |
| Logging PII | Do not log full list contents in production console beyond existing debug norms |

No new secrets. No weakening of JWT on requests.

---

## 6. UX issues

| Issue | Approach |
|-------|----------|
| User unsure if changes are saved | Offline + pending indicators; copy that changes sync when online |
| Sync lag after reconnect | Background flush; optional subtle progress |
| Delete currently dead in UI | Must wire delete as part of this feature |
| Complete-all + offline | Must work locally without waiting for N network calls |
| Search while offline | Local filter only (already client-side) |
| False “failed” toasts on offline mutate | Suppress network-error toasts for queued ops; show offline/pending instead |

---

## 7. Performance issues

| Issue | Approach |
|-------|----------|
| AsyncStorage size | Shopping list is small; full snapshot OK; avoid unbounded queue growth via coalescing |
| Sync storm on reconnect | Single flusher / mutex; backoff on failure |
| UI jank | Optimistic updates; sync off critical path |
| Re-fetch after every op while online | Online path may keep today’s direct API calls **or** unify through queue — design doc will pick one; must not double-apply |
| NetInfo churn | Debounce online events before flush |

---

## 8. Acceptance criteria

- [ ] With network off, open Shopping List and see last synced items (if any).
- [ ] Offline: check/uncheck, add, change qty/unit, delete all update UI immediately and persist across restart.
- [ ] Offline: Complete all checks remaining items locally.
- [ ] When network returns, pending mutations auto-sync without user action.
- [ ] After sync, server list matches local intent (single-device).
- [ ] Offline / pending / sync-error states are visible and non-blocking.
- [ ] Logout clears that user’s cache + queue.
- [ ] Works against Spring and Nest base URLs with existing API shapes.
- [ ] No new backend endpoints required.
- [ ] Unit/integration tests cover cache hydrate, queue coalesce, temp-id remap, and flush ordering.

---

## 9. Related files

| Path | Relevance |
|------|-----------|
| `mobile/src/screens/ShoppingListScreen.tsx` | Primary UX surface |
| `mobile/src/contexts/pantryContext.tsx` | Shopping list state + API orchestration |
| `mobile/src/api/shoppingList.ts` | REST + parse (dual-backend) |
| `mobile/src/api/client.ts` | Network errors / JWT |
| `mobile/src/types.ts` | `ShoppingListItem` type |
| `backend/.../ShoppingList*` (Spring) | Existing API — no change expected |
| `backend-node/src/shopping-list/*` | Existing API — no change expected |

---

## 10. Open items for design phase

Resolved in [`docs/design/offline-shopping-list-design.md`](../design/offline-shopping-list-design.md):

1. Storage schema for snapshot + queue (keys, versioning). → **AsyncStorage v1 user-scoped keys**
2. Online writes: direct API vs always-queue-then-flush. → **Local-first + unified queue**
3. Exact NetInfo package. → **`@react-native-community/netinfo` via `npx expo install`**
4. Temp id format and remap strategy. → **`local_` + UUID; remap on CREATE success**
5. Whether “Retry sync” control is required in v1 UI. → **Secondary control when syncError + pending**
6. Nest vs Spring payload gap. → **Send flat fields + nested `details`** (client-only)

---

## 11. Non-goals (this version)

- Multi-device / multi-tab conflict UI or CRDT merge
- Offline support for pantry, recipes, meal plan, or AI chat
- Web Progressive Web App offline shopping list
- New backend bulk-sync or “pull changes since” APIs
- Guaranteeing consistency if the same account is edited on two devices while one is offline
