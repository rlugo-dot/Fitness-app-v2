-- ─── Sharing columns on workout_logs ─────────────────────────────────────────
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS caption   TEXT;

-- ─── Follows ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Users manage who they follow; everyone can read follow relationships
CREATE POLICY "Users manage own follows"
  ON public.follows FOR ALL
  USING (auth.uid() = follower_id);

CREATE POLICY "Follows are public"
  ON public.follows FOR SELECT
  USING (true);

-- ─── Activity Likes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_likes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workout_log_id)
);

ALTER TABLE public.activity_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own likes"
  ON public.activity_likes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Likes are public"
  ON public.activity_likes FOR SELECT
  USING (true);

-- ─── Shared workout_logs readable by followers ────────────────────────────────
-- Allow reading shared workouts from people you follow (service-role bypasses this anyway,
-- but useful if you later query client-side)
CREATE POLICY "Followers can read shared workouts"
  ON public.workout_logs FOR SELECT
  USING (
    is_shared = TRUE AND (
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM public.follows
        WHERE follower_id = auth.uid() AND following_id = workout_logs.user_id
      )
    )
  );

-- ─── Profiles readable by all (for feed display) ─────────────────────────────
CREATE POLICY "Profiles are public read"
  ON public.profiles FOR SELECT
  USING (true);
