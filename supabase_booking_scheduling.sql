-- Run this in the Supabase SQL Editor
-- Adds proposed_date for pro counter-proposals in the scheduling back-and-forth

ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS proposed_date TIMESTAMPTZ;
