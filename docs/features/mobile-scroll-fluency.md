# Feature: Mobile Scroll Fluency

**Status:** Implemented  
**Scope:** Mobile (`mobile/`) — perceived scroll FPS on FlashList screens  
**Out of scope:** Backend, store migration, custom native scroll modules

---

## 1. Summary

Improve **scroll smoothness** on Shopping, Pantry, Recipes, AI chat, and Calendar week lists by cutting scroll-path JS work: gated autoscroll, FlashList `drawDistance` / `getItemType`, stable headers/callbacks, lighter row press feedback, and cheaper image transitions.

### Locked decisions

| Decision | Choice |
|----------|--------|
| List engine | Keep FlashList v2 (no `estimatedItemSize`) |
| Autoscroll | Only when user is near bottom / after send |
| Row press | Opacity / Pressable — no per-row Reanimated scale on list cells |
| Images | Default transition `0`; heroes pass `200` |

---

## 2. Related

- Parent playbook: [mobile-rn-fluency.md](./mobile-rn-fluency.md)
- Design: [mobile-scroll-fluency-design.md](../design/mobile-scroll-fluency-design.md)
- Progress / tasks under `docs/progress` and `docs/tasks`
