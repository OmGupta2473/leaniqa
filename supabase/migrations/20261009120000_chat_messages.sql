-- Chat messages for the meal logger AI coach.
-- One row per user message or AI reply. Scoped per user + per calendar day (IST).

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'ai')),
  text text NOT NULL,
  data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_user_date_created_idx
  ON chat_messages (user_id, date, created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_select_own"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "chat_messages_insert_own"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chat_messages_delete_own"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- No UPDATE policy: messages are immutable once written.
