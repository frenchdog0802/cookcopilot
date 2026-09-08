# Task 07: Password util HMAC-SHA1 + unit tests

**Phase:** 2 — Auth & health  
**Depends on:** 01  
**Blocks:** 08, 09

## Description

Port Spring `AuthService` password helpers: salt + HMAC-SHA1 hex. No bcrypt in Wave 1.

## Files

| Action | Path |
|--------|------|
| Create | `backend-node/src/auth/password.util.ts` |
| Create | `backend-node/src/auth/password.util.spec.ts` |

## Implementation

```typescript
// encryptPassword: createHmac('sha1', salt).update(password, 'utf8').digest('hex')
// makeSalt: String(Math.round(Date.now() * Math.random()))  // parity with Spring
// authenticate: encryptPassword(plain, salt) === hash
```

- Empty password → `""` hash (Spring behavior).
- Document weakness as comment / README note (tech debt).

## Acceptance criteria

- [ ] Unit tests cover known (password, salt) → hex vectors (generate once from Spring or Node and lock)
- [ ] `authenticate` true/false cases pass
- [ ] No dependency on DB

## How to test

```powershell
cd backend-node
npm test -- password
```
