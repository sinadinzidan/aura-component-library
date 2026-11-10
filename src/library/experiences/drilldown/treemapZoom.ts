import type { DrillNode, DrillTree } from './hierarchy';
import { frameAround, squarify } from './treemapLayout';
import type { TreemapBounds, TreemapRect } from './treemapLayout';

/** The canvas in layout units: rectangles are percentages of it. */
export const TREEMAP_FULL: TreemapBounds = { x: 0, y: 0, width: 100, height: 100 };

/** Rectangles for the children of a node, sized by a metric. */
export function layoutChildren(node: DrillNode, metricKey: string, minShare: number): TreemapRect[] {
  return squarify(
    node.children.map((child) => ({ id: child.id, value: child.metrics[metricKey] ?? 0 })),
    TREEMAP_FULL,
    { minShare }
  );
}

/**
 * Where the new level starts its zoom from. Going in, it starts as the rectangle that was
 * clicked and grows to fill the canvas; going up, it starts blown up so that the rectangle you
 * came from covers the canvas, and shrinks back. `null` when the two paths are unrelated.
 */
export function zoomOrigin(tree: DrillTree, from: readonly string[], to: readonly string[], metricKey: string, minShare: number): TreemapBounds | null {
  const shared = Math.min(from.length, to.length);
  if (from.slice(0, shared).some((id, index) => to[index] !== id) || from.length === to.length) return null;
  const goingIn = to.length > from.length;
  const outerId = goingIn ? from[from.length - 1] : to[to.length - 1];
  const innerId = goingIn ? to[from.length] : from[to.length];
  const outer = outerId === undefined ? undefined : tree.byId.get(outerId);
  if (!outer || innerId === undefined) return null;
  const rect = layoutChildren(outer, metricKey, minShare).find((candidate) => candidate.id === innerId);
  if (!rect) return null;
  const bounds = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  return goingIn ? bounds : frameAround(bounds, TREEMAP_FULL);
}
