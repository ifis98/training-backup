-- Track MongoDB account creation status per Clerk user.
-- Gated by create-webapp-account edge function after TypeformIntake submit.
-- /app page checks status = 'created' before rendering (Task 4, unified registration).

CREATE TABLE IF NOT EXISTS webapp_account (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id    TEXT        UNIQUE NOT NULL,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'created', 'failed')),
  mongodb_user_id  TEXT,
  is_new_user      BOOLEAN,
  error_message    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webapp_account_status_idx ON webapp_account (status);

-- RLS: service role only (edge function uses service role key).
ALTER TABLE webapp_account ENABLE ROW LEVEL SECURITY;
