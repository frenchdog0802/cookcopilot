# Task 09: CookingAssistant and LangChain4jConfig

**Phase:** 1 — Backend foundation  
**Depends on:** 01, 02, 06, 07, 08  
**Blocks:** 10, 13

## Description

Define the LangChain4j AI service interface and Spring configuration bean wiring `OpenAiChatModel`, `MessageWindowChatMemory`, and `CookingTools`.

## Files

| Action | Path |
|--------|------|
| Create | `backend/src/main/java/com/LarderMind/service/ai/CookingAssistant.java` |
| Create | `backend/src/main/java/com/LarderMind/config/LangChain4jConfig.java` |

## Implementation

**CookingAssistant:**

```java
public interface CookingAssistant {
    @SystemMessage(""" ... cooking-only system prompt ... """)
    String chat(@MemoryId UUID userId, @UserMessage String userMessage);
}
```

**LangChain4jConfig:**

```java
@Bean
CookingAssistant cookingAssistant(OpenAiChatModel model, CookingTools tools) {
    return AiServices.builder(CookingAssistant.class)
        .chatModel(model)
        .chatMemoryProvider(id -> MessageWindowChatMemory.builder()
            .id(id)
            .maxMessages(20)
            .build())
        .tools(tools)
        .build();
}
```

System prompt must instruct use of all five tools per design §2.8.

## Acceptance criteria

- [ ] `CookingAssistant` bean created at startup
- [ ] Interface uses `@MemoryId UUID userId` and `@UserMessage String`
- [ ] `MessageWindowChatMemory` max 20 messages
- [ ] All `CookingTools` methods registered as OpenAI tools
- [ ] Manual smoke: call `chat(userId, "hello")` with real API key returns non-empty string (optional dev-only test)

## How to test

1. `@SpringBootTest` asserts `CookingAssistant` bean is not null.
2. Optional manual/dev: invoke with test userId and simple food question.
3. Mock `OpenAiChatModel` in unit test to verify builder wiring (advanced).
