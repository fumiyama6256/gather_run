-- Drop the old nearby_runs function with integer parameter
DROP FUNCTION IF EXISTS public.nearby_runs(double precision, double precision, integer);

-- Keep only the double precision version (already exists from previous migration)
-- This ensures there's only one function signature
