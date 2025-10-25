-- Add test data
-- Sample data around Tokyo area

-- Imperial Palace area
INSERT INTO runs (location, location_name, datetime, description, note, thanks_count)
VALUES (
  ST_SetSRID(ST_MakePoint(139.7528, 35.6850), 4326)::geography,
  'Imperial Palace Outer Garden',
  NOW() + INTERVAL '2 days',
  '5km around Imperial Palace',
  'Pace: around 5:30/km. Beginners welcome!',
  5
);

-- Yoyogi Park
INSERT INTO runs (location, location_name, datetime, description, note, thanks_count)
VALUES (
  ST_SetSRID(ST_MakePoint(139.6959, 35.6719), 4326)::geography,
  'Yoyogi Park',
  NOW() + INTERVAL '1 day',
  'Morning run',
  'Start at 7am. Easy jog.',
  3
);

-- Odaiba
INSERT INTO runs (location, location_name, datetime, description, note, thanks_count)
VALUES (
  ST_SetSRID(ST_MakePoint(139.7737, 35.6280), 4326)::geography,
  'Odaiba Seaside Park',
  NOW() + INTERVAL '3 days',
  '10km beach run',
  'Run while feeling the ocean breeze!',
  8
);

-- Ueno Park
INSERT INTO runs (location, location_name, datetime, description, note, thanks_count)
VALUES (
  ST_SetSRID(ST_MakePoint(139.7738, 35.7148), 4326)::geography,
  'Ueno Park',
  NOW() + INTERVAL '4 days',
  'Interval training',
  '400m x 5 reps. Intermediate level.',
  2
);

-- Komazawa Olympic Park
INSERT INTO runs (location, location_name, datetime, description, note, thanks_count)
VALUES (
  ST_SetSRID(ST_MakePoint(139.6557, 35.6272), 4326)::geography,
  'Komazawa Olympic Park',
  NOW() + INTERVAL '5 days',
  '15km long run',
  'Marathon training. Sub-4 hour goal runners welcome.',
  12
);
