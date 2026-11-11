import { greatCircleKm } from '../../three/scenes/geo';

import { MAX_LATITUDE, fromPlane, mercatorY, toPlane, wrapLongitude } from './projection';
import type { LatLong, ProjectionId } from './projection';

/** What part of the world is shown: the place at the middle of the frame and how large it is drawn. */
export type MapView = { center: LatLong; /** Pixels per radian of the unit sphere. */ scale: number };

export type Size = { width: number; height: number };
export type ScreenPoint = { x: number; y: number };

export const MIN_SCALE = 60;
export const MAX_SCALE = 60000;

const clampScale = (scale: number): number => Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));

/** The view's zoom as a small number to show people: 1 at the minimum scale, doubling per step. */
export function zoomLevel(view: MapView): number {
  return Math.log2(view.scale / MIN_SCALE) + 1;
}

/** Where a place lands in the frame, in pixels from its top left, or `null` when it cannot be shown. */
export function toScreen(projection: ProjectionId, view: MapView, size: Size, point: LatLong): ScreenPoint | null {
  const plane = toPlane(projection, point, view.center);
  if (!plane) return null;
  return { x: size.width / 2 + plane.x * view.scale, y: size.height / 2 - plane.y * view.scale };
}

/** The place under a pixel of the frame. */
export function fromScreen(projection: ProjectionId, view: MapView, size: Size, point: ScreenPoint): LatLong {
  return fromPlane(projection, { x: (point.x - size.width / 2) / view.scale, y: -(point.y - size.height / 2) / view.scale }, view.center);
}

/** Drags the map by a number of pixels: the place under the pointer stays under it. */
export function panBy(projection: ProjectionId, view: MapView, dx: number, dy: number): MapView {
  return { ...view, center: fromPlane(projection, { x: -dx / view.scale, y: dy / view.scale }, view.center) };
}

/**
 * Zooms by a factor around a pixel, so the place under that pixel does not move. Mercator solves
 * this exactly; equal-area, which has no closed form for it, converges in a few steps.
 */
export function zoomAbout(projection: ProjectionId, view: MapView, size: Size, pointer: ScreenPoint, factor: number): MapView {
  const scale = clampScale(view.scale * factor);
  if (scale === view.scale) return view;
  const anchor = fromScreen(projection, view, size, pointer);
  const target = { x: (pointer.x - size.width / 2) / scale, y: -(pointer.y - size.height / 2) / scale };

  if (projection === 'mercator') {
    const lat = fromPlane('mercator', { x: 0, y: mercatorY(anchor.lat) - target.y }, { lat: 0, lon: 0 }).lat;
    const lon = wrapLongitude(anchor.lon - (target.x * 180) / Math.PI);
    return { center: { lat, lon }, scale };
  }

  let center = view.center;
  for (let step = 0; step < 6; step += 1) {
    const current = toPlane(projection, anchor, center);
    if (!current) break;
    center = fromPlane(projection, { x: current.x - target.x, y: current.y - target.y }, center);
  }
  return { center, scale };
}

/** Zooms around the middle of the frame, for buttons and keys. */
export function zoomCentered(projection: ProjectionId, view: MapView, size: Size, factor: number): MapView {
  return zoomAbout(projection, view, size, { x: size.width / 2, y: size.height / 2 }, factor);
}

/** The view that shows all of the points with a margin, as large as it can be. One point centres on it at a fixed zoom. */
export function fitPoints(projection: ProjectionId, size: Size, points: readonly LatLong[], padding = 48, singlePointScale = 6000): MapView {
  if (points.length === 0) return { center: { lat: 0, lon: 0 }, scale: MIN_SCALE };
  if (points.length === 1) return { center: points[0], scale: singlePointScale };
  const lats = points.map((point) => point.lat);
  const lons = points.map((point) => point.lon);
  // Longitudes are taken relative to the first point, so a group across ±180° stays together.
  const reference = lons[0];
  const relative = lons.map((lon) => wrapLongitude(lon - reference));
  let center: LatLong = {
    lat: (Math.min(...lats) + Math.max(...lats)) / 2,
    lon: wrapLongitude(reference + (Math.min(...relative) + Math.max(...relative)) / 2),
  };
  let scale = MAX_SCALE;
  // The centre shifts with the scale in equal-area, so settle in a few rounds.
  for (let round = 0; round < 3; round += 1) {
    const planes = points.map((point) => toPlane(projection, point, center));
    if (planes.some((plane) => plane === null)) return { center, scale: MIN_SCALE };
    const xs = planes.flatMap((plane) => (plane ? [plane.x] : []));
    const ys = planes.flatMap((plane) => (plane ? [plane.y] : []));
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    const fitX = width > 1e-9 ? (size.width - padding * 2) / width : MAX_SCALE;
    const fitY = height > 1e-9 ? (size.height - padding * 2) / height : MAX_SCALE;
    scale = clampScale(Math.min(fitX, fitY));
    center = fromPlane(projection, { x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2 }, center);
  }
  return { center, scale };
}

/** Whether a pixel is inside the frame, with an optional margin. */
export function isInFrame(size: Size, point: ScreenPoint, margin = 0): boolean {
  return point.x >= -margin && point.y >= -margin && point.x <= size.width + margin && point.y <= size.height + margin;
}

/** Ground distance covered by one pixel at the middle of the frame, in kilometres. */
export function kilometresPerPixel(projection: ProjectionId, view: MapView, size: Size): number {
  const middle: ScreenPoint = { x: size.width / 2, y: size.height / 2 };
  const a = fromScreen(projection, view, size, middle);
  const b = fromScreen(projection, view, size, { x: middle.x + 1, y: middle.y });
  return greatCircleKm(a, b);
}

export { MAX_LATITUDE };
