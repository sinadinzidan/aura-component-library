import type { Vec3 } from '../cameraTargets';

/** A point on the globe, in degrees: latitude north-positive, longitude east-positive. */
export type LatLong = { lat: number; lon: number };

const RADIANS = Math.PI / 180;

export const toRadians = (degrees: number): number => degrees * RADIANS;
export const toDegrees = (radians: number): number => radians / RADIANS;

/**
 * Projects latitude and longitude onto a sphere centred on the origin. North is +y, the prime
 * meridian faces +z and east is +x — so a camera on the +z axis sees 0°E with east to its right.
 */
export function latLongToVec3(lat: number, lon: number, radius = 1): Vec3 {
  const phi = toRadians(lat);
  const lambda = toRadians(lon);
  const ring = Math.cos(phi) * radius;
  return [ring * Math.sin(lambda) + 0, Math.sin(phi) * radius + 0, ring * Math.cos(lambda) + 0];
}

/** The inverse of `latLongToVec3`: the latitude and longitude a point lies above. Longitude is −180 to 180. */
export function vec3ToLatLong(point: Vec3): LatLong {
  const length = Math.hypot(point[0], point[1], point[2]);
  if (length === 0) return { lat: 0, lon: 0 };
  return { lat: toDegrees(Math.asin(Math.min(1, Math.max(-1, point[1] / length)))), lon: toDegrees(Math.atan2(point[0], point[2])) + 0 };
}

/** Angle between two points as seen from the centre of the globe, in radians. */
export function centralAngle(a: LatLong, b: LatLong): number {
  const [ax, ay, az] = latLongToVec3(a.lat, a.lon);
  const [bx, by, bz] = latLongToVec3(b.lat, b.lon);
  return Math.acos(Math.min(1, Math.max(-1, ax * bx + ay * by + az * bz)));
}

/** Great-circle distance in kilometres on a sphere the size of the Earth. */
export function greatCircleKm(a: LatLong, b: LatLong, earthRadiusKm = 6371): number {
  return centralAngle(a, b) * earthRadiusKm;
}

/**
 * Spherical interpolation between two unit directions: the direction a fraction `t` of the way
 * along the shortest great circle from `from` to `to`. Identical directions return `from`;
 * antipodes, which have no single shortest path, go around a fixed perpendicular axis.
 */
export function slerpDirection(from: Vec3, to: Vec3, t: number): Vec3 {
  const dot = Math.min(1, Math.max(-1, from[0] * to[0] + from[1] * to[1] + from[2] * to[2]));
  const angle = Math.acos(dot);
  if (angle < 1e-6) return from;
  if (Math.PI - angle < 1e-6) {
    // Antipodes: every great circle fits, so go over a fixed perpendicular axis.
    const helper: Vec3 = Math.abs(from[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const side = normalize([from[1] * helper[2] - from[2] * helper[1], from[2] * helper[0] - from[0] * helper[2], from[0] * helper[1] - from[1] * helper[0]]);
    const via = normalize([side[1] * from[2] - side[2] * from[1], side[2] * from[0] - side[0] * from[2], side[0] * from[1] - side[1] * from[0]]);
    const half = t * Math.PI;
    return [from[0] * Math.cos(half) + via[0] * Math.sin(half), from[1] * Math.cos(half) + via[1] * Math.sin(half), from[2] * Math.cos(half) + via[2] * Math.sin(half)];
  }
  const sin = Math.sin(angle);
  const a = Math.sin((1 - t) * angle) / sin;
  const b = Math.sin(t * angle) / sin;
  return [from[0] * a + to[0] * b, from[1] * a + to[1] * b, from[2] * a + to[2] * b];
}

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector[0], vector[1], vector[2]);
  return length === 0 ? [0, 1, 0] : [vector[0] / length, vector[1] / length, vector[2] / length];
}

/** The point a fraction `t` of the way along the great circle between two places. */
export function interpolateGreatCircle(a: LatLong, b: LatLong, t: number): LatLong {
  return vec3ToLatLong(slerpDirection(latLongToVec3(a.lat, a.lon), latLongToVec3(b.lat, b.lon), Math.min(1, Math.max(0, t))));
}

export type ArcOptions = {
  radius?: number;
  /** Number of straight pieces the arc is drawn with. */
  segments?: number;
  /** Peak height above the surface, as a fraction of the radius per radian of arc length. */
  lift?: number;
  /** Lowest peak height as a fraction of the radius, so short hops still leave the surface. */
  minLift?: number;
};

/**
 * Points of an arc between two places: it follows the great circle and rises off the surface in
 * the middle, higher for longer hops, so routes read as flights over the globe.
 */
export function greatCircleArc(a: LatLong, b: LatLong, options: ArcOptions = {}): Vec3[] {
  const { radius = 1, segments = 32, lift = 0.25, minLift = 0.015 } = options;
  const from = latLongToVec3(a.lat, a.lon);
  const to = latLongToVec3(b.lat, b.lon);
  const peak = Math.max(minLift, centralAngle(a, b) * lift);
  const count = Math.max(1, Math.round(segments));
  return Array.from({ length: count + 1 }, (_, index) => {
    const t = index / count;
    const [x, y, z] = slerpDirection(from, to, t);
    const height = radius * (1 + Math.sin(t * Math.PI) * peak);
    return [x * height, y * height, z * height];
  });
}

/**
 * Adds points along the great circle wherever two neighbours are more than `maxStepDegrees` apart,
 * so a coarse outline hugs the sphere instead of cutting through it.
 */
export function densifyPolyline(points: readonly LatLong[], maxStepDegrees: number, closed = false): LatLong[] {
  if (points.length < 2) return [...points];
  const maxStep = toRadians(Math.max(0.1, maxStepDegrees));
  const ends = closed ? points.length : points.length - 1;
  const dense: LatLong[] = [];
  for (let index = 0; index < ends; index += 1) {
    const from = points[index];
    const to = points[(index + 1) % points.length];
    const pieces = Math.max(1, Math.ceil(centralAngle(from, to) / maxStep - 1e-9));
    dense.push(from);
    for (let piece = 1; piece < pieces; piece += 1) dense.push(interpolateGreatCircle(from, to, piece / pieces));
  }
  if (!closed) dense.push(points[points.length - 1]);
  return dense;
}

/** A polyline of places as points on a sphere. */
export function projectPolyline(points: readonly LatLong[], radius = 1): Vec3[] {
  return points.map((point) => latLongToVec3(point.lat, point.lon, radius));
}

/**
 * Vertex pairs for the line segments of a latitude/longitude grid: parallels every `latStep`
 * degrees (poles excluded) and meridians every `lonStep`, each drawn with `segmentDegrees` pieces.
 * Returns a flat x, y, z list ready for a `position` buffer.
 */
export function graticuleSegments(radius: number, latStep = 15, lonStep = 15, segmentDegrees = 5): number[] {
  const vertices: number[] = [];
  const push = (a: Vec3, b: Vec3) => vertices.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  for (let lat = -90 + latStep; lat < 90; lat += latStep) {
    for (let lon = -180; lon < 180; lon += segmentDegrees) push(latLongToVec3(lat, lon, radius), latLongToVec3(lat, lon + segmentDegrees, radius));
  }
  for (let lon = -180; lon < 180; lon += lonStep) {
    for (let lat = -90; lat < 90; lat += segmentDegrees) push(latLongToVec3(lat, lon, radius), latLongToVec3(lat + segmentDegrees, lon, radius));
  }
  return vertices;
}

/** Where a camera stands and how far out: the place it looks straight down on, and its distance from the centre. */
export type GlobeView = { lat: number; lon: number; distance: number };

/** Camera position for a view. The camera always looks at the centre of the globe. */
export function globeCameraPosition(view: GlobeView): Vec3 {
  return latLongToVec3(view.lat, view.lon, view.distance);
}

/** The view a camera position corresponds to. */
export function globeViewFrom(position: Vec3): GlobeView {
  return { ...vec3ToLatLong(position), distance: Math.hypot(position[0], position[1], position[2]) };
}

/**
 * Camera position a fraction `t` (already eased) of the way from one position to another, swinging
 * around the globe at a blended distance — never through it, which a straight line would do.
 */
export function interpolateOrbit(from: Vec3, to: Vec3, t: number): Vec3 {
  const clamped = Math.min(1, Math.max(0, t));
  const fromDistance = Math.hypot(from[0], from[1], from[2]);
  const toDistance = Math.hypot(to[0], to[1], to[2]);
  if (fromDistance === 0 || toDistance === 0) return to;
  const direction = slerpDirection(normalize(from), normalize(to), clamped);
  const distance = fromDistance + (toDistance - fromDistance) * clamped;
  return [direction[0] * distance, direction[1] * distance, direction[2] * distance];
}

/** Rotates a position around the vertical axis by an angle in radians (positive spins the view east). */
export function rotateAboutY(position: Vec3, angle: number): Vec3 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [position[0] * cos + position[2] * sin, position[1], -position[0] * sin + position[2] * cos];
}

/** Whether a place is on the half of the globe facing a camera position. */
export function isFacing(place: LatLong, cameraPosition: Vec3): boolean {
  const [x, y, z] = latLongToVec3(place.lat, place.lon);
  const distance = Math.hypot(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
  if (distance === 0) return false;
  // Visible when the angle to the camera direction is inside the horizon cap, cos(angle) > 1 / distance.
  return (x * cameraPosition[0] + y * cameraPosition[1] + z * cameraPosition[2]) / distance > 1 / Math.max(distance, 1);
}

/** Marker radius for a value: area grows with the value, between `min` and `max` radius. */
export function markerRadius(value: number, maxValue: number, min: number, max: number): number {
  if (maxValue <= 0 || value <= 0) return min;
  return min + (max - min) * Math.sqrt(Math.min(1, value / maxValue));
}
