# Feature: Backend Node — Wave 1.5 + Wave 2 Complete

**Status:** Implemented  
**Scope:** Complete Spring API parity in `backend-node/` including meal-plan confirm/skip, chat (LangChain.js), Cloudinary upload, Stripe/IAP subscription.

## Wave 1.5

- `GET /api/meal-plan/pending-confirm`
- `POST /api/meal-plan/{id}/confirm` — pantry deduction + inventory audit
- `POST /api/meal-plan/{id}/skip`
- Status auto-transitions (PLANNED → PENDING_CONFIRM → auto-SKIPPED)
- Shopping-list auto-add on meal-plan create when pantry short

## Wave 2

| Area | Endpoints |
|------|-----------|
| Chat | `POST /api/chat/send`, `POST /api/chat/stream` (SSE), `GET/DELETE /api/chat/history`, `GET /api/chat/actions` |
| Upload | `POST /api/upload/image`, `DELETE /api/upload/image/:publicId` |
| Subscription | `GET /api/subscription/plans` (public), `GET /api/subscription/status`, `POST /api/subscription/sync`, `POST /api/subscription/validate-receipt`, `POST /api/subscription/checkout`, `POST /api/subscription/webhook` (public) |

## Acceptance

1. All Spring controllers have Nest equivalents.
2. `npm run build`, `npm test`, `npm run test:e2e` pass.
3. `test/api.e2e-spec.ts` exercises full CRUD when Postgres is up.
4. `backend-node/Dockerfile` + `railway.toml` ready for Render/Railway cutover.

## Deploy cutover

Point Render/Railway **Root Directory** to `backend-node/`. Reuse existing env vars from Spring `backend/.env`. Remove `JAVA_OPTS` / `SPRING_*` vars.
