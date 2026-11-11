import { densifyPolyline } from '../../three/scenes/geo';

import { toScreen } from './mapView';
import type { MapView, ScreenPoint, Size } from './mapView';
import { MAX_LATITUDE } from './projection';
import type { LatLong, ProjectionId } from './projection';

const round = (value: number): number => Math.round(value * 10) / 10;

/** Pixel points of a place list, dropping places that cannot be shown. */
export function projectPoints(projection: ProjectionId, view: MapView, size: Size, points: readonly LatLong[], lonOffset = 0): (ScreenPoint | null)[] {
  return points.map((point) => toScreen(projection, view, size, { lat: point.lat, lon: point.lon + lonOffset }));
}

/** An SVG path through pixel points. A missing point lifts the pen, so a line never jumps across the map. */
export function pathThrough(points: readonly (ScreenPoint | null)[], closed = false): string {
  let path = '';
  let pen = false;
  for (const point of points) {
    if (!point) {
      pen = false;
      continue;
    }
    path += `${pen ? 'L' : 'M'}${round(point.x)} ${round(point.y)}`;
    pen = true;
  }
  return closed && path !== '' ? `${path}Z` : path;
}

/**
 * The path of one coastline or outline. Mercator draws three copies of the world a full turn
 * apart, so shapes that cross the antimeridian still close; equal-area densifies the edges so
 * they curve with the projection and any edge that still jumps across the disc is cut, which also
 * drops the fill.
 */
export function outlinePaths(projection: ProjectionId, view: MapView, size: Size, points: readonly LatLong[], closed: boolean): { d: string; filled: boolean }[] {
  if (projection === 'mercator') {
    return [-360, 0, 360].flatMap((offset) => {
      const projected = projectPoints(projection, view, size, points, offset);
      const xs = projected.flatMap((point) => (point ? [point.x] : []));
      // Skip a copy that is entirely outside the frame.
      if (xs.length === 0 || Math.max(...xs) < -size.width || Math.min(...xs) > size.width * 2) return [];
      // The projection wraps longitudes relative to the centre, so a closed shape must be unwrapped.
      return [{ d: pathThrough(unwrapJumps(projected, size.width + view.scale * Math.PI), closed), filled: closed }];
    });
  }
  const dense = densifyPolyline(points, 4, closed);
  const projected = projectPoints(projection, view, size, dense);
  const jump = view.scale * 1.2;
  const broken = projected.some((point, index) => {
    const next = projected[(index + 1) % projected.length];
    return point !== null && next !== null && Math.hypot(point.x - next.x, point.y - next.y) > jump;
  });
  if (broken) {
    const cut = projected.map((point, index) => {
      const previous = projected[index - 1];
      return point && previous && Math.hypot(point.x - previous.x, point.y - previous.y) > jump ? null : point;
    });
    return [{ d: pathThrough(cut, false), filled: false }];
  }
  return [{ d: pathThrough(projected, closed), filled: closed }];
}

/** Lifts the pen wherever two neighbours are further apart than half the world is wide. */
function unwrapJumps(points: readonly (ScreenPoint | null)[], limit: number): (ScreenPoint | null)[] {
  const half = limit / 2;
  return points.map((point, index) => {
    const previous = points[index - 1];
    return point && previous && Math.abs(point.x - previous.x) > half ? null : point;
  });
}

export type GraticuleLine = { id: string; kind: 'meridian' | 'parallel'; degrees: number; d: string };

/** The spacing of graticule lines for a zoom: the finest step that still leaves them about 64 pixels apart. */
export function graticuleStep(scale: number): number {
  const pixelsPerDegree = (scale * Math.PI) / 180;
  const steps = [0.5, 1, 2, 5, 10, 15, 30];
  return steps.find((step) => step * pixelsPerDegree >= 64) ?? 30;
}

/** Meridians and parallels as paths, every `step` degrees, limited to what Mercator can show. */
export function graticule(projection: ProjectionId, view: MapView, size: Size, step: number, bounds?: { south: number; north: number; west: number; east: number }): GraticuleLine[] {
  const south = Math.max(-MAX_LATITUDE + 1, bounds ? Math.floor(bounds.south / step) * step : -80);
  const north = Math.min(MAX_LATITUDE - 1, bounds ? Math.ceil(bounds.north / step) * step : 80);
  const west = bounds ? Math.floor(bounds.west / step) * step : -180;
  const east = bounds ? Math.ceil(bounds.east / step) * step : 180;
  const sample = Math.min(step, 2);
  const lines: GraticuleLine[] = [];

  for (let lon = west; lon <= east + 1e-9; lon += step) {
    const points: LatLong[] = [];
    for (let lat = south; lat <= north + 1e-9; lat += sample) points.push({ lat, lon });
    lines.push({ id: `meridian-${lon}`, kind: 'meridian', degrees: lon, d: pathThrough(projectPoints(projection, view, size, points)) });
  }
  for (let lat = Math.ceil(south / step) * step; lat <= north + 1e-9; lat += step) {
    const points: LatLong[] = [];
    for (let lon = west; lon <= east + 1e-9; lon += sample) points.push({ lat, lon });
    const projected = projectPoints(projection, view, size, points);
    lines.push({ id: `parallel-${lat}`, kind: 'parallel', degrees: lat, d: pathThrough(projection === 'mercator' ? unwrapJumps(projected, size.width + view.scale * Math.PI) : projected) });
  }
  return lines;
}

export type Chevron = { x: number; y: number; /** Degrees clockwise from east. */ angle: number };

/**
 * Direction marks along a polyline: one every `spacing` pixels, pointing along its direction of
 * travel. Placed on the pixel path, so they stay evenly spaced at every zoom.
 */
export function chevronsAlong(points: readonly (ScreenPoint | null)[], spacing: number, size?: Size): Chevron[] {
  const marks: Chevron[] = [];
  let carried = spacing / 2;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    if (!from || !to) continue;
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (length === 0) continue;
    const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
    let at = carried;
    while (at <= length) {
      const x = from.x + ((to.x - from.x) * at) / length;
      const y = from.y + ((to.y - from.y) * at) / length;
      if (!size || (x >= 0 && y >= 0 && x <= size.width && y <= size.height)) marks.push({ x, y, angle });
      at += spacing;
    }
    carried = at - length;
  }
  return marks;
}

export type BlockCell = { id: string; south: number; north: number; west: number; east: number; row: number; column: number };

/** A regular grid of licence blocks over a box, numbered row by row from the north west. */
export function blockGrid(box: { south: number; north: number; west: number; east: number }, lonStep: number, latStep: number): BlockCell[] {
  const cells: BlockCell[] = [];
  const rows = Math.round((box.north - box.south) / latStep);
  const columns = Math.round((box.east - box.west) / lonStep);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      cells.push({
        id: `B${row * columns + column + 1}`,
        north: box.north - row * latStep,
        south: box.north - (row + 1) * latStep,
        west: box.west + column * lonStep,
        east: box.west + (column + 1) * lonStep,
        row,
        column,
      });
    }
  }
  return cells;
}
