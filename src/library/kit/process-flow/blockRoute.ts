/** Geometry of a block diagram: where blocks sit on the grid and how lines run between them. */

export type GridBlock = { id: string; col: number; row: number };

export type BlockMetrics = { cellWidth: number; cellHeight: number; blockWidth: number; blockHeight: number };

export const BLOCK_METRICS: BlockMetrics = { cellWidth: 176, cellHeight: 112, blockWidth: 132, blockHeight: 60 };

/** Metrics for a diagram `width` px wide with `cols` columns: blocks keep readable type and shrink with the cell. */
export function metricsFor(width: number, cols: number): BlockMetrics {
  if (width <= 0 || cols <= 0) return BLOCK_METRICS;
  const cellWidth = Math.max(112, Math.min(220, width / cols));
  return { cellWidth, cellHeight: BLOCK_METRICS.cellHeight, blockWidth: Math.max(92, Math.min(148, cellWidth - 40)), blockHeight: BLOCK_METRICS.blockHeight };
}

export type Box = { x: number; y: number; width: number; height: number };

/** The rectangle of a block, centred in its grid cell. */
export function blockBox(block: GridBlock, metrics: BlockMetrics = BLOCK_METRICS): Box {
  return {
    x: block.col * metrics.cellWidth + (metrics.cellWidth - metrics.blockWidth) / 2,
    y: block.row * metrics.cellHeight + (metrics.cellHeight - metrics.blockHeight) / 2,
    width: metrics.blockWidth,
    height: metrics.blockHeight,
  };
}

export type Route = {
  /** Corner points from the source edge to the target edge. */
  points: readonly [number, number][];
  /** Where a label sits: the middle of the longest leg. */
  label: { x: number; y: number };
  /** Unit vector of the last leg, for the arrow head. */
  heading: [number, number];
};

function longestLegMiddle(points: readonly [number, number][]): { x: number; y: number } {
  let best = { x: points[0][0], y: points[0][1] };
  let longest = -1;
  for (let index = 1; index < points.length; index += 1) {
    const [x1, y1] = points[index - 1];
    const [x2, y2] = points[index];
    const length = Math.abs(x2 - x1) + Math.abs(y2 - y1);
    if (length > longest) {
      longest = length;
      best = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    }
  }
  return best;
}

/**
 * A right-angled route between two blocks. Forward lines leave the right side and enter the left;
 * blocks in the same column join top to bottom; a line that runs backwards (a recycle) loops over
 * the top of both blocks.
 */
export function routeBetween(from: GridBlock, to: GridBlock, metrics: BlockMetrics = BLOCK_METRICS): Route {
  const a = blockBox(from, metrics);
  const b = blockBox(to, metrics);
  const aMidY = a.y + a.height / 2;
  const bMidY = b.y + b.height / 2;
  let points: [number, number][];
  if (to.col > from.col) {
    const startX = a.x + a.width;
    const midX = (startX + b.x) / 2;
    points =
      aMidY === bMidY
        ? [
            [startX, aMidY],
            [b.x, bMidY],
          ]
        : [
            [startX, aMidY],
            [midX, aMidY],
            [midX, bMidY],
            [b.x, bMidY],
          ];
  } else if (to.col === from.col) {
    const x = a.x + a.width / 2;
    points =
      to.row > from.row
        ? [
            [x, a.y + a.height],
            [x, b.y],
          ]
        : [
            [x, a.y],
            [x, b.y + b.height],
          ];
  } else {
    const over = Math.min(a.y, b.y) - (metrics.cellHeight - metrics.blockHeight) / 2 + 8;
    const startX = a.x + a.width / 2;
    const endX = b.x + b.width / 2;
    points = [
      [startX, a.y],
      [startX, over],
      [endX, over],
      [endX, b.y],
    ];
  }
  const [px, py] = points[points.length - 2];
  const [ex, ey] = points[points.length - 1];
  const length = Math.hypot(ex - px, ey - py) || 1;
  return { points, label: longestLegMiddle(points), heading: [(ex - px) / length, (ey - py) / length] };
}

/** SVG path through the corner points. */
export function routePath(points: readonly [number, number][]): string {
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
}

/** Triangle at the end of a route, pointing along its heading. */
export function arrowHead(tip: readonly [number, number], heading: readonly [number, number], size = 8): string {
  const [x, y] = tip;
  const [dx, dy] = heading;
  const backX = x - dx * size * 1.4;
  const backY = y - dy * size * 1.4;
  return `M ${x} ${y} L ${backX - dy * size * 0.7} ${backY + dx * size * 0.7} L ${backX + dy * size * 0.7} ${backY - dx * size * 0.7} Z`;
}
