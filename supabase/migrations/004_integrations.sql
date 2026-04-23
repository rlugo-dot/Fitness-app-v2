-- ─── Weight Logs ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg   DECIMAL(5,2) NOT NULL,
  body_fat_pct DECIMAL(4,1),
  notes       TEXT,
  logged_at   DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own weight logs"
  ON public.weight_logs FOR ALL
  USING (auth.uid() = user_id);

-- ─── User Integrations ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT        NOT NULL CHECK (provider IN ('oura', 'whoop', 'withings')),
  access_token  TEXT        NOT NULL,
  refresh_token TEXT,
  token_expiry  TIMESTAMPTZ,
  connected_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integrations"
  ON public.user_integrations FOR ALL
  USING (auth.uid() = user_id);
