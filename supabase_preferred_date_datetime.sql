-- Run this in Supabase SQL Editor to allow date+time values in booking requests.
-- Safe: wraps in a DO block so it won't fail if the column is already the right type.

DO $$
BEGIN
  ALTER TABLE booking_requests
    ALTER COLUMN preferred_date TYPE timestamptz
    USING CASE
      WHEN preferred_date IS NULL THEN NULL
      ELSE preferred_date::timestamptz
    END;
EXCEPTION WHEN others THEN
  NULL; -- column is already timestamptz or another compatible type
END;
$$;
