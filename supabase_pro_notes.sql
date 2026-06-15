-- ─────────────────────────────────────────────────────────────────────────────
-- Phitness — Professional Notes table
--
-- Run this in the Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS professional_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id     UUID        NOT NULL,
  client_id  UUID        NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS professional_notes_pro_client
  ON professional_notes(pro_id, client_id);

ALTER TABLE professional_notes ENABLE ROW LEVEL SECURITY;
