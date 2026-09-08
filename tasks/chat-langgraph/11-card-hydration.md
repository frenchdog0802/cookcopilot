# Task 11: History card hydration

**Phase:** 3  
**Depends on:** 07, 09, 10  
**Blocks:** 14

## Description

History DTO includes responseType/cardData; web + mobile restore cards on hydrate.

## Acceptance criteria

- [ ] Reload chat shows prior action cards when cardData present
- [ ] Old text-only rows still render

## How to test

Save assistant with cardData; GET history; verify UI mapping.
