/**
 * Pixel geometry of the dashboard grid: how wide a column is, how far a pointer has travelled in
 * cells, and where a cell sits in pixels. Pure, so snapping can be tested without a browser.
 */

export type GridMetrics = {
  /** Width of one column in pixels, without the gap. */
  colWidth: number;
  /** Height of one row in pixels, without the gap. */
  rowHeight: number;
  /** Gap between cells in pixels, the same in both directions. */
  gap: number;
};

/** Derives the column width from the measured width of the grid. */
export function gridMetrics(width: number, cols: number, rowHeight: number, gap: number): GridMetrics {
  const colWidth = cols > 0 ? Math.max(0, (width - gap * (cols - 1)) / cols) : 0;
  return { colWidth, rowHeight, gap };
}

/** Converts a pointer travel in pixels to whole cells, snapping to the nearest cell. */
export function deltaToCells(dx: number, dy: number, metrics: GridMetrics): { cols: number; rows: number } {
  const stepX = metrics.colWidth + metrics.gap;
  const stepY = metrics.rowHeight + metrics.gap;
  // `|| 0` turns the -0 that Math.round gives for small negative travel into 0.
  return {
    cols: stepX > 0 ? Math.round(dx / stepX) || 0 : 0,
    rows: stepY > 0 ? Math.round(dy / stepY) || 0 : 0,
  };
}

/** Converts a distance in cells to pixels, including the gaps crossed. */
export function cellsToPixels(cols: number, rows: number, metrics: GridMetrics): { x: number; y: number } {
  return { x: cols * (metrics.colWidth + metrics.gap), y: rows * (metrics.rowHeight + metrics.gap) };
}

/** The pixel size of an item that spans the given number of columns and rows. */
export function spanToPixels(w: number, h: number, metrics: GridMetrics): { width: number; height: number } {
  return {
    width: Math.max(0, w * metrics.colWidth + (w - 1) * metrics.gap),
    height: Math.max(0, h * metrics.rowHeight + (h - 1) * metrics.gap),
  };
}
