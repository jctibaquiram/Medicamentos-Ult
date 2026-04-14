-- Allow authenticated users to read only their own profile row.
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Authenticated users can read own profile'
  ) THEN
    CREATE POLICY "Authenticated users can read own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = id
        OR lower(auth.email()) = lower(email)
      );
  END IF;
END
$$;

-- Helps exact/ilike lookups by email in role resolution.
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
  ON public.profiles (lower(email));
