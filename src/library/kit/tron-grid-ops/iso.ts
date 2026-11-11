/**
 * Isometric projection for flat SVG drawings: a ground grid of x (to the lower right) and y (to
 * the lower left) with z straight up. Boxes are returned as the three faces a viewer sees.
 */

export type IsoView = { originX: number; originY: number; unit: number };

export type IsoPoint = { x: number; y: number };

export type IsoBox = { top: string; left: string; right: string };

const COS = Math.cos(Math.PI / 6);

const tidy = (value: number): number => Number(value.toFixed(1));

/** Screen position of a grid point. */
export function isoPoint(view: IsoView, x: number, y: number, z = 0): IsoPoint {
  return {
    x: tidy(view.originX + (x - y) * view.unit * COS),
    y: tidy(view.originY + (x + y) * view.unit * 0.5 - z * view.unit),
  };
}

/** `points` attribute for a polygon or polyline through grid points given as `[x, y, z]`. */
export function isoPoints(view: IsoView, points: readonly (readonly [number, number, number])[]): string {
  return points
    .map(([x, y, z]) => {
      const point = isoPoint(view, x, y, z);
      return `${point.x},${point.y}`;
    })
    .join(' ');
}

/** The visible faces of a box standing at `(x, y)` on height `base`: top, left (facing −x) and right (facing +x). */
export function isoBox(view: IsoView, x: number, y: number, width: number, depth: number, height: number, base = 0): IsoBox {
  const top = base + height;
  return {
    top: isoPoints(view, [
      [x, y, top],
      [x + width, y, top],
      [x + width, y + depth, top],
      [x, y + depth, top],
    ]),
    left: isoPoints(view, [
      [x, y + depth, base],
      [x + width, y + depth, base],
      [x + width, y + depth, top],
      [x, y + depth, top],
    ]),
    right: isoPoints(view, [
      [x + width, y, base],
      [x + width, y + depth, base],
      [x + width, y + depth, top],
      [x + width, y, top],
    ]),
  };
}
