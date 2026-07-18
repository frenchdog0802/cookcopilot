# Task 17: Web shopping_list_updated card and navigation

**Phase:** 2 — Frontend  
**Depends on:** 14  
**Blocks:** 23

## Description

Render shopping list update card and navigate to Shopping List view on button click.

## Files

| Action | Path |
|--------|------|
| Modify | `frontend/client/src/components/AICookingAssistant.tsx` |

## UI spec

```
Added {itemsAdded} items to your shopping list
[chips for item names]
[View Shopping List]
```

**Data fields:** `itemsAdded`, `items: [{ name, quantity, unit }]`

**View Shopping List:** `setCurrentView('shoppingList')` + refresh shopping list in `pantryContext`.

## Acceptance criteria

- [ ] Card renders for `type === 'shopping_list_updated'`
- [ ] Chips show item names (quantity/unit optional in chip label)
- [ ] "View Shopping List" switches view and refreshes list data
- [ ] `type === 'error'` shows error-styled assistant bubble with server message
- [ ] Typing indicator unchanged during send wait

## How to test

1. Mock response with 3 items → 3 chips + count label.
2. Click View Shopping List → navigates to shopping list view.
3. E2E with backend tool call → items visible in shopping list.
