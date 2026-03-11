-- Add GPS coordinate columns to activity_logs
ALTER TABLE public.activity_logs
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS gps_accuracy double precision;
