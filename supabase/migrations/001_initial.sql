-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL DEFAULT '',
    age             INTEGER,
    weight_kg       NUMERIC(5,1),
    height_cm       NUMERIC(5,1),
    goal            TEXT NOT NULL DEFAULT 'maintain',   -- lose | gain | maintain
    daily_calorie_goal INTEGER NOT NULL DEFAULT 2000,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── Food Logs ─────────────────────────────────────────────────────────────────
CREATE TABLE food_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id     TEXT NOT NULL,
    food_name   TEXT NOT NULL,
    meal_type   TEXT NOT NULL,   -- breakfast | lunch | dinner | snack
    quantity    NUMERIC(6,2) NOT NULL DEFAULT 1,
    calories    NUMERIC(7,1) NOT NULL,
    protein_g   NUMERIC(6,1) NOT NULL DEFAULT 0,
    carbs_g     NUMERIC(6,1) NOT NULL DEFAULT 0,
    fat_g       NUMERIC(6,1) NOT NULL DEFAULT 0,
    fiber_g     NUMERIC(6,1) NOT NULL DEFAULT 0,
    log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own food logs" ON food_logs
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX food_logs_user_date ON food_logs(user_id, log_date);


-- ─── Water Logs ────────────────────────────────────────────────────────────────
CREATE TABLE water_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    glasses     INTEGER NOT NULL DEFAULT 0,
    log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, log_date)
);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own water logs" ON water_logs
    FOR ALL USING (auth.uid() = user_id);
