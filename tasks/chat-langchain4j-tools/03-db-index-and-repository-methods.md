# Task 03: DB index and repository methods

**Phase:** 1 — Backend foundation  
**Depends on:** None  
**Blocks:** 05, 06, 07, 08, 11

## Description

Add the performance index on `ai_messages` and extend repositories for chat history, ingredient lookup, and recipe ownership checks.

## Files

| Action | Path |
|--------|------|
| Modify | `backend/src/main/resources/schema.sql` (or migration script) |
| Modify | `backend/src/main/java/com/LarderMind/repository/AIMessageRepository.java` |
| Modify | `backend/src/main/java/com/LarderMind/repository/IngredientRepository.java` |
| Modify | `backend/src/main/java/com/LarderMind/repository/RecipeRepository.java` |

## Implementation

**Index:**

```sql
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_created
    ON ai_messages (user_id, created_at DESC);
```

**AIMessageRepository:**

```java
List<AIMessage> findTop20ByUserIdOrderByCreatedAtDesc(UUID userId);
List<AIMessage> findTop50ByUserIdOrderByCreatedAtDesc(UUID userId);
```

**IngredientRepository:**

```java
Optional<Ingredient> findByNameIgnoreCase(String name);
List<Ingredient> findAllByNameInIgnoreCase(Collection<String> names);
```

**RecipeRepository:**

```java
Optional<Recipe> findByIdAndUserId(UUID id, UUID userId);
```

## Acceptance criteria

- [ ] Index SQL committed and applied in dev/test DB
- [ ] All four repository methods compile and are used by Spring Data
- [ ] `findTop20` / `findTop50` return correct row counts with fixture data
- [ ] `findByIdAndUserId` returns empty for another user's recipe
- [ ] `findAllByNameInIgnoreCase` matches names case-insensitively

## How to test

- Repository integration test with Testcontainers or `@DataJpaTest` + H2/PostgreSQL.
- Manual: `EXPLAIN` on history query shows index usage (optional smoke).
