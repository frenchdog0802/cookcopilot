# Task 01: Add LangChain4j dependency

**Phase:** 1 — Backend foundation  
**Depends on:** None  
**Blocks:** 02, 09

## Description

Add the LangChain4j OpenAI Spring Boot starter to the backend Maven project so `OpenAiChatModel` can be auto-configured.

## Files

| Action | Path |
|--------|------|
| Modify | `backend/pom.xml` |

## Implementation

Add to `pom.xml`:

```xml
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-open-ai-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

## Acceptance criteria

- [ ] Dependency resolves without version conflicts
- [ ] `mvn -f backend compile` succeeds
- [ ] No changes to existing chat behavior yet (old `OpenAIService` path still active)

## How to test

```bash
cd backend && mvn compile -q
```

Verify the dependency appears in `mvn dependency:tree | grep langchain4j`.
