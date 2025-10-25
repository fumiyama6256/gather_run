export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Run = {
  id: string;
  location: string; // PostGIS geography
  location_name: string | null;
  datetime: string;
  description: string;
  note: string | null;
  thanks_count: number;
  created_at: string;
};

export type RunMarker = {
  id: string;
  coordinate: Coordinate;
  location_name: string | null;
  datetime: string;
  description: string;
  note: string | null;
  thanks_count: number;
};
