-- ─── Workout Logs ──────────────────────────────────────────────────────────────
CREATE TABLE workout_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    workout_type    TEXT NOT NULL,      -- weights | cardio | bjj_mma | other
    name            TEXT NOT NULL DEFAULT '',
    duration_min    INTEGER NOT NULL DEFAULT 0,
    calories_burned INTEGER NOT NULL DEFAULT 0,
    exercises       JSONB NOT NULL DEFAULT '[]',
    log_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workout logs" ON workout_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX workout_logs_user_date ON workout_logs(user_id, log_date);


-- ─── Health Conditions (on profiles) ──────────────────────────────────────────
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS health_conditions TEXT[] NOT NULL DEFAULT '{}';
