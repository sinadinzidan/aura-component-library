/** Squarified treemap layout (Bruls, Huizing, van Wijk): rectangles as close to square as the values allow. */

export type TreemapItem = { id: string; value: number };

export type TreemapBounds = { x: number; y: number; width: number; height: number };

export type TreemapRect = TreemapBounds & {
  id: string;
  /** The item's real value, untouched by `minShare`. */
  value: number;
  /** Share of the bounds the rectangle covers, 0–1. */
  share: number;
};

export type TreemapOptions = {
  /**
   * Smallest share of the area any item gets, 0–1. Keeps zero and tiny values visible and
   * clickable; the label still prints the real value.
   */
  minShare?: number;
};

type Weighted = { id: string; value: number; area: number };

/** Worst aspect ratio in a row of areas laid along a side of length `side`. */
function worstRatio(row: readonly number[], side: number): number {
  const sum = row.reduce((total, area) => total + area, 0);
  if (sum <= 0 || side <= 0) return Infinity;
  const max = Math.max(...row);
  const min = Math.min(...row);
  const sideSquared = side * side;
  return Math.max((sideSquared * max) / (sum * sum), (sum * sum) / (sideSquared * min));
}

/**
 * Lays `items` out inside `bounds`, largest first. Negative values count as zero. The rectangles
 * tile the bounds exactly: their areas add up to it and none overlap.
 */
export function squarify(items: readonly TreemapItem[], bounds: TreemapBounds, options: TreemapOptions = {}): TreemapRect[] {
  if (items.length === 0 || bounds.width <= 0 || bounds.height <= 0) return [];
  const minShare = Math.min(Math.max(options.minShare ?? 0, 0), 1 / items.length);

  const values = items.map((item) => Math.max(0, Number.isFinite(item.value) ? item.value : 0));
  const total = values.reduce((sum, value) => sum + value, 0);
  const raw = values.map((value) => (total > 0 ? Math.max(value / total, minShare) : 1));
  const rawTotal = raw.reduce((sum, weight) => sum + weight, 0);
  const totalArea = bounds.width * bounds.height;

  const weighted: Weighted[] = items
    .map((item, index) => ({ id: item.id, value: item.value, area: ((raw[index] ?? 0) / rawTotal) * totalArea }))
    .filter((item) => item.area > 0)
    .sort((a, b) => b.area - a.area);

  const rects: TreemapRect[] = [];
  let { x, y, width, height } = bounds;
  let row: Weighted[] = [];

  const flush = () => {
    const rowArea = row.reduce((sum, item) => sum + item.area, 0);
    if (rowArea <= 0) return;
    if (width >= height) {
      // A column on the left: full remaining height, as wide as its area needs.
      const columnWidth = rowArea / height;
      let cursor = y;
      for (const item of row) {
        const itemHeight = item.area / columnWidth;
        rects.push({ id: item.id, value: item.value, share: item.area / totalArea, x, y: cursor, width: columnWidth, height: itemHeight });
        cursor += itemHeight;
      }
      x += columnWidth;
      width -= columnWidth;
    } else {
      const rowHeight = rowArea / width;
      let cursor = x;
      for (const item of row) {
        const itemWidth = item.area / rowHeight;
        rects.push({ id: item.id, value: item.value, share: item.area / totalArea, x: cursor, y, width: itemWidth, height: rowHeight });
        cursor += itemWidth;
      }
      y += rowHeight;
      height -= rowHeight;
    }
    row = [];
  };

  for (const item of weighted) {
    const side = Math.min(width, height);
    const areas = row.map((entry) => entry.area);
    if (row.length > 0 && worstRatio([...areas, item.area], side) > worstRatio(areas, side)) flush();
    row.push(item);
  }
  flush();

  return rects;
}

/** Longer side over shorter side; 1 is a square. */
export function aspectRatio(rect: Pick<TreemapBounds, 'width' | 'height'>): number {
  const long = Math.max(rect.width, rect.height);
  const short = Math.min(rect.width, rect.height);
  return short <= 0 ? Infinity : long / short;
}

/**
 * The frame to start from so that `inner` appears to grow until it fills `outer`: where the outer
 * frame has to sit for `inner` to cover it exactly. Used to zoom out of a rectangle.
 */
export function frameAround(inner: TreemapBounds, outer: TreemapBounds): TreemapBounds {
  const scaleX = outer.width / inner.width;
  const scaleY = outer.height / inner.height;
  return {
    x: outer.x - (inner.x - outer.x) * scaleX,
    y: outer.y - (inner.y - outer.y) * scaleY,
    width: outer.width * scaleX,
    height: outer.height * scaleY,
  };
}
