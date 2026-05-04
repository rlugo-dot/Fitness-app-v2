CREATE TABLE IF NOT EXISTS professional_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  bio TEXT NOT NULL,
  location TEXT NOT NULL,
  years_exp INTEGER NOT NULL DEFAULT 0,
  rate_php INTEGER NOT NULL DEFAULT 0,
  avatar_emoji TEXT DEFAULT '👨‍⚕️',
  avatar_color TEXT DEFAULT '#16a34a',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  applied_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS professional_applications_email_idx
  ON professional_applications (lower(email));

ALTER TABLE professional_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (no login needed)
CREATE POLICY "public_can_apply" ON professional_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Backend service role handles all reads/updates via RLS bypass
