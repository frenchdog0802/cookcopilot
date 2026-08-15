# Task 16: Restyle AICookingAssistantScreen

**Phase:** 4 — Stack & shared  
**Depends on:** 02, 04, 06  
**Blocks:** 17, 19

## Description

Token-align AI chat screen chrome, bubbles, composer, and spinners. Do not change chat API contracts or tool-card behavior beyond colors/spacing.

## Files

| Action | Path |
|--------|------|
| Modify | `mobile/src/screens/AICookingAssistantScreen.tsx` |

## Implementation

1. Linen (or surface) chat background; quiet header with back.
2. Herb send button; muted placeholders; ink message text.
3. Replace orange accents / gray-50 shells.
4. Keep `initialPrompt`, history, and action cards functional.

## Acceptance criteria

- [ ] No orange header/send branding
- [ ] Can send a message (or see composer enabled) without UI crash
- [ ] Back returns to previous screen
- [ ] Existing card types still render

## How to test

Open AI from Home CTA; verify header/composer colors; send smoke message if backend available (UI-only OK if offline error handled as before).
