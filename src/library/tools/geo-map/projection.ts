import type { LatLong } from '../../three/scenes/geo';

export type { LatLong };

export type ProjectionId = 'mercator' | 'equal-area';

export const PROJECTIONS: readonly { id: ProjectionId; label: string }[] = [
  { id: 'mercator', label: 'Mercator' },
  { id: 'equal-area', label: 'Equal area' },
];

/** Mercator cannot show the poles; it stops where a square tile would. */
export const MAX_LATITUDE = 85.0511;

const RADIANS = Math.PI / 180;
const toRad = (degrees: number): number => degrees * RADIANS;
const toDeg = (radians: number): number => radians / RADIANS;

/** A longitude brought into −180 to 180. */
export function wrapLongitude(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

/** A point on the flat plane of a projection, in radians of the unit sphere. East is +x, north is +y. */
export type PlanePoint = { x: number; y: number };

export function mercatorY(lat: number): number {
  const phi = toRad(Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat)));
  return Math.log(Math.tan(Math.PI / 4 + phi / 2));
}

export function inverseMercatorY(y: number): number {
  return toDeg(2 * Math.atan(Math.exp(y)) - Math.PI / 2);
}

/**
 * Projects a place onto the plane of a projection, measured from the map centre (which lands on
 * the origin). `mercator` keeps angles and shows the world as a strip; `equal-area` is Lambert's
 * azimuthal equal-area, which keeps areas true around the centre. Returns `null` for the one
 * point equal-area cannot show: the centre's antipode.
 */
export function toPlane(projection: ProjectionId, point: LatLong, center: LatLong): PlanePoint | null {
  if (projection === 'mercator') {
    return { x: toRad(wrapLongitude(point.lon - center.lon)), y: mercatorY(point.lat) - mercatorY(center.lat) };
  }
  const phi = toRad(point.lat);
  const phi0 = toRad(center.lat);
  const dLambda = toRad(point.lon - center.lon);
  const denominator = 1 + Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dLambda);
  if (denominator < 1e-9) return null;
  const k = Math.sqrt(2 / denominator);
  return { x: k * Math.cos(phi) * Math.sin(dLambda), y: k * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dLambda)) };
}

/** The inverse of `toPlane`: the place at a position on the plane. Positions off the map clamp to its edge. */
export function fromPlane(projection: ProjectionId, plane: PlanePoint, center: LatLong): LatLong {
  if (projection === 'mercator') {
    const lat = inverseMercatorY(plane.y + mercatorY(center.lat));
    return { lat: Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat)), lon: wrapLongitude(center.lon + toDeg(plane.x)) };
  }
  const rho = Math.hypot(plane.x, plane.y);
  if (rho < 1e-12) return { lat: center.lat, lon: center.lon };
  const c = 2 * Math.asin(Math.min(1, rho / 2));
  const phi0 = toRad(center.lat);
  const sinLat = Math.cos(c) * Math.sin(phi0) + (plane.y * Math.sin(c) * Math.cos(phi0)) / rho;
  const lon = toRad(center.lon) + Math.atan2(plane.x * Math.sin(c), rho * Math.cos(phi0) * Math.cos(c) - plane.y * Math.sin(phi0) * Math.sin(c));
  return { lat: toDeg(Math.asin(Math.max(-1, Math.min(1, sinLat)))), lon: wrapLongitude(toDeg(lon)) };
}

/** Formats a position as `65.30° N, 7.20° E`. */
export function formatLatLong(point: LatLong, decimals = 2): string {
  const lat = `${Math.abs(point.lat).toFixed(decimals)}° ${point.lat >= 0 ? 'N' : 'S'}`;
  const wrapped = wrapLongitude(point.lon);
  return `${lat}, ${Math.abs(wrapped).toFixed(decimals)}° ${wrapped >= 0 ? 'E' : 'W'}`;
}
