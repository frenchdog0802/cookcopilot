# Task 18: Update auth tests + run Jest

**Phase:** 5 — Verify  
**Depends on:** 07, 08, 03  
**Blocks:** 20

## Description

Update auth screen tests for any copy/structure changes and ensure the mobile Jest suite passes.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/__tests__/screens/auth-screens.test.tsx` |
| Modify | `mobile/jest.setup.js` (if extra mocks needed) |

## Implementation

1. Adjust `getByText` / placeholders only if Login/SignUp copy changed.
2. Keep assertions that email auth works and social SSO buttons remain absent.
3. Run full mobile test script; fix failures caused by this feature (fonts, NativeWind, etc.).

## Acceptance criteria

- [ ] `npm test` exits 0 in `mobile/`
- [ ] Login/SignUp smoke tests still cover validation + login call
- [ ] No new flaky font/network dependencies in tests

## How to test

```bash
cd mobile && npm test
```
