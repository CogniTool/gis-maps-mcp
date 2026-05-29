export interface Coordinate {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
  type: string;
  importance: number;
  boundingBox?: [number, number, number, number];
}

export interface ReverseGeocodeResult {
  displayName: string;
  address: Record<string, string>;
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distanceKm: number;
  distanceMiles: number;
  distanceMeters: number;
  from: Coordinate;
  to: Coordinate;
}

export interface BoundingBoxResult {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  center: Coordinate;
  width: number;
  height: number;
}

export interface PointInPolygonResult {
  isInside: boolean;
  point: Coordinate;
}

export interface AdminLookupResult {
  province: string | null;
  district: string | null;
  ward: string | null;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  coordinate: Coordinate;
}
