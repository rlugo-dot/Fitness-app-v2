-- ─── Professionals directory ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.professionals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT        NOT NULL,
  title           TEXT        NOT NULL,   -- e.g. "Registered Nutritionist-Dietitian"
  specialties     TEXT[]      NOT NULL DEFAULT '{}',
  bio             TEXT        NOT NULL DEFAULT '',
  rate_php        INTEGER     NOT NULL DEFAULT 0,   -- per session
  location        TEXT        NOT NULL DEFAULT '',
  years_exp       INTEGER     NOT NULL DEFAULT 0,
  avatar_emoji    TEXT        NOT NULL DEFAULT '👤',
  avatar_color    TEXT        NOT NULL DEFAULT 'bg-green-500',
  contact_email   TEXT        NOT NULL DEFAULT '',
  is_available    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Public read, admin write (service role handles inserts)
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professionals are public read"
  ON public.professionals FOR SELECT
  USING (true);

-- ─── Booking requests ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id   UUID        NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  message           TEXT        NOT NULL DEFAULT '',
  preferred_date    DATE,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own booking requests"
  ON public.booking_requests FOR ALL
  USING (auth.uid() = user_id);

-- ─── Seed data ────────────────────────────────────────────────────────────────
INSERT INTO public.professionals
  (name, title, specialties, bio, rate_php, location, years_exp, avatar_emoji, avatar_color, contact_email)
VALUES
  (
    'Maria Santos, RND',
    'Registered Nutritionist-Dietitian',
    ARRAY['Weight Management', 'PCOS', 'Hormonal Health'],
    'Specializes in sustainable weight management and hormonal health. Advocates for a balanced Filipino diet — no crash diets, just real food and science-backed guidance.',
    1500, 'Makati / Online', 8, '👩', 'bg-pink-500',
    'maria.santos@nutrisyon.ph'
  ),
  (
    'James Reyes, RND',
    'Sports Nutritionist',
    ARRAY['Sports Nutrition', 'Muscle Gain', 'Athletic Performance'],
    'Works with competitive athletes from amateur to national level. Former varsity swimmer. Specializes in periodized nutrition for strength and endurance sports.',
    2000, 'BGC / Online', 6, '👨', 'bg-blue-600',
    'james.reyes@nutrisyon.ph'
  ),
  (
    'Dr. Ana Cruz, MD-RND',
    'Medical Nutritionist',
    ARRAY['Diabetes', 'Hypertension', 'Heart Disease'],
    'Dual-licensed physician and nutritionist with a focus on chronic disease reversal through medical nutrition therapy. Conducts quarterly wellness programs at St. Luke''s.',
    3500, 'Quezon City / Online', 12, '👩‍⚕️', 'bg-teal-600',
    'dr.cruz@nutrisyon.ph'
  ),
  (
    'Carlo Mendoza, CSCS',
    'Strength & Conditioning Coach',
    ARRAY['Strength Training', 'Fat Loss', 'Body Recomposition'],
    'NSCA-certified strength coach and ISSA-certified nutritionist. Blends progressive overload training with flexible dieting. Clients range from desk workers to competitive powerlifters.',
    1800, 'Pasig / Online', 5, '🧔', 'bg-orange-600',
    'carlo.mendoza@nutrisyon.ph'
  ),
  (
    'Pia Lim, RND',
    'Pediatric & Family Nutritionist',
    ARRAY['Pediatric Nutrition', 'Family Meal Planning', 'Allergies'],
    'Passionate about building healthy eating habits from childhood. Experienced in managing food allergies, picky eating, and creating family meal plans that everyone enjoys.',
    1200, 'Mandaluyong / Online', 7, '👩', 'bg-yellow-500',
    'pia.lim@nutrisyon.ph'
  ),
  (
    'Marco Villanueva, RND-CPT',
    'Nutrition & Personal Trainer',
    ARRAY['Weight Loss', 'Nutrition Coaching', 'Cardio Training'],
    'Dual-certified RND and personal trainer. Offers integrated programs combining structured workouts with personalized meal plans. Specializes in busy professionals who have limited gym time.',
    2200, 'Ortigas / Online', 4, '🧑', 'bg-green-600',
    'marco.villanueva@nutrisyon.ph'
  ),
  (
    'Dr. Sofia Tan, RND',
    'Gut Health & IBS Specialist',
    ARRAY['IBS', 'Gut Health', 'Food Sensitivities'],
    'Completed post-grad training in functional nutrition and gastrointestinal dietetics. Uses low-FODMAP and elimination protocols to help clients manage IBS, bloating, and food intolerances.',
    2500, 'Makati / Online', 9, '👩', 'bg-purple-600',
    'dr.tan@nutrisyon.ph'
  ),
  (
    'Kuya Ben Aquino, BJJ Black Belt',
    'Combat Sports Nutritionist & Coach',
    ARRAY['BJJ / MMA', 'Weight Cutting', 'Combat Sports Conditioning'],
    'BJJ black belt and certified sports nutritionist. Helps fighters optimize performance and cut weight safely. Coached athletes competing in IBJJF, ONE Championship qualifiers.',
    1800, 'Quezon City / Online', 10, '🥋', 'bg-red-700',
    'ben.aquino@nutrisyon.ph'
  );
