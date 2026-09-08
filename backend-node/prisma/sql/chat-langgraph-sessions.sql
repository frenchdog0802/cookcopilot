-- LangGraph chat sessions migration (apply manually or via your DB migration process).
-- Safe to re-run: uses IF NOT EXISTS where possible.

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL DEFAULT 'New chat',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  locked_at BIGINT,
  created_at BIGINT,
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_updated
  ON chat_sessions (user_id, updated_at DESC);

ALTER TABLE ai_messages
  ADD COLUMN IF NOT EXISTS session_id UUID,
  ADD COLUMN IF NOT EXISTS response_type VARCHAR(64),
  ADD COLUMN IF NOT EXISTS card_data JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_messages_session_id_fkey'
  ) THEN
    ALTER TABLE ai_messages
      ADD CONSTRAINT ai_messages_session_id_fkey
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_messages_session_created
  ON ai_messages (session_id, created_at DESC);

-- Backfill: one default session per user that has messages, then attach orphans.
INSERT INTO chat_sessions (id, user_id, title, is_default, created_at, updated_at)
SELECT gen_random_uuid(), u.user_id, 'Chat', TRUE,
       EXTRACT(EPOCH FROM NOW())::BIGINT,
       EXTRACT(EPOCH FROM NOW())::BIGINT
FROM (SELECT DISTINCT user_id FROM ai_messages) u
WHERE NOT EXISTS (
  SELECT 1 FROM chat_sessions s WHERE s.user_id = u.user_id AND s.is_default = TRUE
);

UPDATE ai_messages m
SET session_id = s.id
FROM chat_sessions s
WHERE m.session_id IS NULL
  AND s.user_id = m.user_id
  AND s.is_default = TRUE;
