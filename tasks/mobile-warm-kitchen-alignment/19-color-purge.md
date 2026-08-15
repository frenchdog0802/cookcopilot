# Task 19: Legacy color purge verification

**Phase:** 5 — Verify  
**Depends on:** 05–17  
**Blocks:** 20

## Description

Verify mobile UI sources no longer use legacy orange branding or rainbow stat/action tile palettes as primary accents.

## Files

| Action | Path |
|--------|------|
| Search / fix | `mobile/App.tsx` |
| Search / fix | `mobile/src/**/*.{tsx,ts}` |

## Implementation

1. Search for: `orange`, `#f97316`, `#ea580c`, `from-orange`, `pink-50`, `blue-50`, `red-50`, `green-50` (as brand tiles), `#dc2626` used as brand (danger-only OK for errors/delete).
2. Replace any remaining brand hits with tokens.
3. Record intentional exceptions (e.g. `colors.danger`) in progress notes.

## Acceptance criteria

- [ ] No orange tab/header/CTA branding left
- [ ] No rainbow home-style stat tiles left
- [ ] Any remaining red is clearly error/destructive only
- [ ] Search results documented in `progress.md` Notes if exceptions exist

## How to test

```powershell
# From repo root — adjust if Select-String preferred
Get-ChildItem -Path mobile\App.tsx,mobile\src -Recurse -Include *.tsx,*.ts |
  Select-String -Pattern 'orange|#f97316|pink-50|blue-50|bg-red-50|bg-green-50' |
  Where-Object { $_.Path -notmatch 'node_modules' }
```

Expect no brand matches (or only documented danger usages).
