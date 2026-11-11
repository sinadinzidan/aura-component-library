/** A point on a vertical section: distance out from the wellhead and depth below it, in metres. */
export type SectionPoint = { departure: number; tvd: number };

export type SectionSize = { width: number; height: number };

export type SectionMargin = { top: number; right: number; bottom: number; left: number };

export type SectionFrame = {
  /** Pixels per metre, the same in both directions so angles on the drawing are true. */
  scale: number;
  plot: { left: number; top: number; width: number; height: number };
  x: (departure: number) => number;
  y: (tvd: number) => number;
};

/**
 * Fits a section of `maxDeparture` by `maxDepth` metres into a drawing of `size`, inside `margin`,
 * at one scale for both axes. The plot is anchored top left: the wellhead sits in that corner.
 */
export function sectionFrame(size: SectionSize, margin: SectionMargin, maxDeparture: number, maxDepth: number): SectionFrame {
  const availableWidth = Math.max(1, size.width - margin.left - margin.right);
  const availableHeight = Math.max(1, size.height - margin.top - margin.bottom);
  const scale = Math.min(availableWidth / Math.max(maxDeparture, 1), availableHeight / Math.max(maxDepth, 1));
  const plot = { left: margin.left, top: margin.top, width: maxDeparture * scale, height: maxDepth * scale };
  return {
    scale,
    plot,
    x: (departure) => plot.left + departure * scale,
    y: (tvd) => plot.top + tvd * scale,
  };
}

/** An SVG path through the points, in drawing coordinates. Empty for fewer than two points. */
export function sectionPath(points: readonly SectionPoint[], frame: Pick<SectionFrame, 'x' | 'y'>): string {
  if (points.length < 2) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${frame.x(point.departure).toFixed(1)} ${frame.y(point.tvd).toFixed(1)}`).join(' ');
}

/** Grid values from zero up to and including `max`, every `step`. */
export function axisSteps(max: number, step: number): number[] {
  if (step <= 0 || max < 0) return [0];
  return Array.from({ length: Math.floor(max / step + 1e-9) + 1 }, (_, index) => index * step);
}

/** Where a path first reaches a depth, by linear interpolation between its points. `null` if it never does. */
export function crossingAt(path: readonly SectionPoint[], tvd: number): SectionPoint | null {
  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1];
    const to = path[index];
    if ((from.tvd <= tvd && to.tvd >= tvd) || (from.tvd >= tvd && to.tvd <= tvd)) {
      const span = to.tvd - from.tvd;
      const share = span === 0 ? 0 : (tvd - from.tvd) / span;
      return { departure: from.departure + (to.departure - from.departure) * share, tvd };
    }
  }
  return null;
}

/** The deepest point of a path, or the origin for an empty one. */
export function deepestPoint(path: readonly SectionPoint[]): SectionPoint {
  return path.reduce((deepest, point) => (point.tvd > deepest.tvd ? point : deepest), path[0] ?? { departure: 0, tvd: 0 });
}

/** The point furthest out from the wellhead, or the origin for an empty path. */
export function furthestPoint(path: readonly SectionPoint[]): SectionPoint {
  return path.reduce((furthest, point) => (point.departure > furthest.departure ? point : furthest), path[0] ?? { departure: 0, tvd: 0 });
}

/**
 * Which end of a surface line to name it at: the far end normally, the wellhead end when the well
 * runs near that depth more than 40 % of the way out, where its path and marks would run into the name.
 */
export function horizonLabelSide(path: readonly SectionPoint[], tvd: number, maxDeparture: number, clearance = 350): 'start' | 'end' {
  return path.some((point) => Math.abs(point.tvd - tvd) < clearance && point.departure > maxDeparture * 0.4) ? 'start' : 'end';
}
