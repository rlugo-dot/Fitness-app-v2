-- ─────────────────────────────────────────────────────────────────────────────
-- Phitness — Row Level Security
--
-- Run this entire file in the Supabase SQL Editor (one shot).
-- The backend uses the service-role key and bypasses RLS entirely.
-- These policies protect against anyone querying the DB directly with the
-- anon/authenticated key (e.g. someone extracting the key from the frontend).
-- ─────────────────────────────────────────────────────────────────────────────


-- ─── 1. Enable RLS on every table ────────────────────────────────────────────

ALTER TABLE profiles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_foods              ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_likes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                  ENABLE ROW LEVEL SECURITY;


-- ─── 2. profiles ─────────────────────────────────────────────────────────────
-- Full access for profile owner.
-- Other authenticated users can SELECT (needed for social feed / user search).

CREATE POLICY "profiles: owner full access"
  ON profiles FOR ALL
  USING     (auth.uid() = id)
  WITH CHECK(auth.uid() = id);

CREATE POLICY "profiles: authenticated read-only"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);


-- ─── 3. food_logs ────────────────────────────────────────────────────────────
-- Strictly private — only the owner can touch their own food logs.

CREATE POLICY "food_logs: owner only"
  ON food_logs FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ─── 4. workout_logs ─────────────────────────────────────────────────────────
-- Owner has full access.
-- Followed users' workout_logs are readable (social feed shows them).

CREATE POLICY "workout_logs: owner full access"
  ON workout_logs FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

CREATE POLICY "workout_logs: followed users readable"
  ON workout_logs FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT following_id FROM follows WHERE follower_id = auth.uid()
    )
  );


-- ─── 5. weight_logs ──────────────────────────────────────────────────────────
-- Strictly private — body weight data never exposed directly.

CREATE POLICY "weight_logs: owner only"
  ON weight_logs FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ─── 6. water_logs ───────────────────────────────────────────────────────────

CREATE POLICY "water_logs: owner only"
  ON water_logs FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ─── 7. custom_foods ─────────────────────────────────────────────────────────

CREATE POLICY "custom_foods: owner only"
  ON custom_foods FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ─── 8. user_integrations ────────────────────────────────────────────────────

CREATE POLICY "user_integrations: owner only"
  ON user_integrations FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ─── 9. push_subscriptions ───────────────────────────────────────────────────

CREATE POLICY "push_subscriptions: owner only"
  ON push_subscriptions FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ─── 10. subscriptions ───────────────────────────────────────────────────────

CREATE POLICY "subscriptions: owner only"
  ON subscriptions FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ─── 11. professionals ───────────────────────────────────────────────────────
-- Any authenticated user can browse the professional directory (read-only).
-- Only the matching professional (matched by email from JWT) can update
-- their own row. INSERT and DELETE are admin-only via the service-role backend.

CREATE POLICY "professionals: authenticated read"
  ON professionals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "professionals: self update"
  ON professionals FOR UPDATE
  TO authenticated
  USING     (lower(auth.jwt() ->> 'email') = lower(email))
  WITH CHECK(lower(auth.jwt() ->> 'email') = lower(email));


-- ─── 12. booking_requests ────────────────────────────────────────────────────
-- Users can create and view their own booking requests.
-- Professionals can view and update bookings where they are the recipient.
-- The pro is identified by matching their auth email to the professionals table.

CREATE POLICY "booking_requests: user full access"
  ON booking_requests FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

CREATE POLICY "booking_requests: pro can read their bookings"
  ON booking_requests FOR SELECT
  TO authenticated
  USING (
    professional_id IN (
      SELECT id FROM professionals
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "booking_requests: pro can update status"
  ON booking_requests FOR UPDATE
  TO authenticated
  USING (
    professional_id IN (
      SELECT id FROM professionals
      WHERE lower(email) = lower(auth.jwt() ->> 'email')
    )
  );


-- ─── 13. professional_applications ───────────────────────────────────────────
-- Applicants can view their own application and submit one.
-- Approval / rejection is admin-only via the service-role backend.

CREATE POLICY "professional_applications: own read"
  ON professional_applications FOR SELECT
  TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "professional_applications: own insert"
  ON professional_applications FOR INSERT
  TO authenticated
  WITH CHECK(lower(email) = lower(auth.jwt() ->> 'email'));


-- ─── 14. follows ─────────────────────────────────────────────────────────────
-- All authenticated users can read follow relationships (social feed needs this
-- to decide whose workout_logs to surface).
-- A user can only create or delete their own follow (follower_id = them).

CREATE POLICY "follows: authenticated read"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "follows: own insert"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK(auth.uid() = follower_id);

CREATE POLICY "follows: own delete"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);


-- ─── 15. activity_likes ──────────────────────────────────────────────────────
-- All authenticated users can read likes (like counts on the feed).
-- A user can only insert or delete their own like.

CREATE POLICY "activity_likes: authenticated read"
  ON activity_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "activity_likes: own write"
  ON activity_likes FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ─── 16. conversations ───────────────────────────────────────────────────────
-- A user can only see and manage conversations they are the user side of.

CREATE POLICY "conversations: user owns"
  ON conversations FOR ALL
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);


-- ─── 17. messages ────────────────────────────────────────────────────────────
-- A message is readable / writable only if the user owns the parent conversation.

CREATE POLICY "messages: conversation participant read"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "messages: conversation participant send"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK(
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );
