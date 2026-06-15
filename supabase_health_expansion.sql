-- Run this in the Supabase SQL Editor

-- Vital Signs Logs
CREATE TABLE IF NOT EXISTS vital_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  logged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  bp_systolic  INTEGER,
  bp_diastolic INTEGER,
  blood_glucose NUMERIC(5,1),
  spo2         NUMERIC(4,1),
  heart_rate   INTEGER,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS vital_logs_user_time ON vital_logs(user_id, logged_at DESC);
ALTER TABLE vital_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vital_logs: owner only" ON vital_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Medications
CREATE TABLE IF NOT EXISTS medications (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL,
  name      TEXT NOT NULL,
  dosage    TEXT,
  frequency TEXT NOT NULL DEFAULT 'once_daily',
  notes     TEXT,
  active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS medications_user_id ON medications(user_id, active);
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medications: owner only" ON medications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Medication Dose Logs
CREATE TABLE IF NOT EXISTS medication_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  taken_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes         TEXT
);
CREATE INDEX IF NOT EXISTS medication_logs_user_date ON medication_logs(user_id, taken_at DESC);
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medication_logs: owner only" ON medication_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
