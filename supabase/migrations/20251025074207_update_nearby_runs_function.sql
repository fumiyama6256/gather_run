-- Update nearby_runs function to return distance and location as text
CREATE OR REPLACE FUNCTION public.nearby_runs(
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  location TEXT,
  location_name TEXT,
  datetime TIMESTAMP WITH TIME ZONE,
  description TEXT,
  note TEXT,
  thanks_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    ST_AsText(r.location::geometry) AS location,
    r.location_name,
    r.datetime,
    r.description,
    r.note,
    r.thanks_count,
    r.created_at,
    ST_Distance(
      r.location,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) / 1000 AS distance_km
  FROM public.runs r
  WHERE ST_DWithin(
    r.location,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY distance_km, r.datetime;
END;
$$;

-- Enable realtime for runs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.runs;
