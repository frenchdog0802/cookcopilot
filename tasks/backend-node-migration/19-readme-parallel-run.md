# Task 19: README + parallel-run docs

**Phase:** 4 — Verify & docs  
**Depends on:** 01, 02  
**Blocks:** 20

## Description

Document how to run Node beside Spring and point clients via env. Optional docker-compose **comment** only (do not replace Spring service yet).

## Files

| Action | Path |
|--------|------|
| Modify | `backend-node/README.md` |
| Modify | `README.md` (repo map / quick run note) |
| Modify | `docs/Overall Project Structure.md` (add `backend-node/`) |
| Optional | `docker-compose.yml` comments for future Node service |

## Implementation

Document:

- Copy env from Spring; set `PORT=8081`
- `npm install` / `npm run dev`
- Web: `VITE_API_BASE_URL=http://localhost:8081`
- Mobile: `EXPO_PUBLIC_API_BASE_URL=http://localhost:8081/api/`
- Prisma introspect-only warning
- Wave 1.5/2 gaps (confirm/skip, chat, upload, subscription)
- Password/JWT compatibility notes (brief)

## Acceptance criteria

- [ ] New contributor can run Node from README alone
- [ ] Root docs mention parallel backends
- [ ] Spring remains default primary in compose/docs

## How to test

Read-through; dry-run commands from a clean shell.
