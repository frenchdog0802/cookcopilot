# Task 02: Add LangChain4j application config

**Phase:** 1 — Backend foundation  
**Depends on:** 01  
**Blocks:** 09, 10

## Description

Configure LangChain4j to use existing OpenAI environment variables via `${…}` references. Keep `app.openai.*` keys for backward compatibility.

## Files

| Action | Path |
|--------|------|
| Modify | `backend/src/main/resources/application.yml` |

## Implementation

```yaml
langchain4j:
  open-ai:
    chat-model:
      api-key: ${OPENAI_API_KEY}
      model-name: ${app.openai.model:gpt-4o-mini}
      temperature: ${app.openai.temperature:0.6}
      max-tokens: ${app.openai.max-tokens:1000}
      timeout: 30s
```

## Acceptance criteria

- [ ] Config block present under `langchain4j.open-ai.chat-model`
- [ ] All properties reference existing env vars or `app.openai.*` defaults
- [ ] Application starts with valid `OPENAI_API_KEY` (no config binding errors)
- [ ] `OpenAiChatModel` bean is created when context loads (verify via actuator/startup or a smoke `@SpringBootTest`)

## How to test

1. Start backend with `OPENAI_API_KEY` set.
2. Confirm no `ConfigurationProperties` binding errors in logs.
3. Optional: add a minimal `@SpringBootTest` that asserts `OpenAiChatModel` bean exists.
