-- RPC関数: IDでRunを取得し、locationをテキスト形式で返す
CREATE OR REPLACE FUNCTION get_run_with_location(run_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  location text,
  location_name text,
  datetime timestamptz,
  description text,
  note text,
  thanks_count integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    id,
    user_id,
    ST_AsText(location) as location,
    location_name,
    datetime,
    description,
    note,
    thanks_count,
    created_at
  FROM runs
  WHERE id = run_id;
$$;
