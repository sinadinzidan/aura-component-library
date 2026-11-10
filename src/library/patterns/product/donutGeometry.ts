/** Geometry for a donut drawn as dashed circle strokes. Pure, so it can be tested without a DOM. */

export type DonutArc = {
  /** Length of the visible stroke, in the same unit as the circumference. */
  length: number;
  /** Distance from the start of the circle to the start of this arc. */
  offset: number;
  /** Share of the total, 0–1. */
  share: number;
};

/**
 * One arc per value, in order, starting at the top of the circle. `gap` is the space left between
 * neighbouring arcs; it is dropped when a single value makes up the whole ring. Values that are
 * zero, negative or not a number get an empty arc and keep their place in the result.
 */
export function donutArcs(values: readonly number[], circumference: number, gap = 0): DonutArc[] {
  const clean = values.map((value) => (Number.isFinite(value) && value > 0 ? value : 0));
  const total = clean.reduce((sum, value) => sum + value, 0);
  const visible = clean.filter((value) => value > 0).length;
  const spacing = visible > 1 ? gap : 0;
  let start = 0;

  return clean.map((value) => {
    if (total === 0 || value === 0) return { length: 0, offset: start, share: 0 };
    const share = value / total;
    const span = share * circumference;
    const arc = { length: Math.max(span - spacing, 0), offset: start, share };
    start += span;
    return arc;
  });
}

/** Share as a whole percent, with "<1%" for a small non-zero share so it is not read as nothing. */
export function formatShare(share: number): string {
  if (!Number.isFinite(share) || share <= 0) return '0%';
  const percent = Math.round(share * 100);
  return percent < 1 ? '<1%' : `${percent}%`;
}
