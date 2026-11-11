/** How far a large title has collapsed into the app bar, from how far its screen has scrolled. */

/** The scroll distance, in pixels, over which the large title collapses. */
export const COLLAPSE_RANGE = 56;

/** 0 at the top, 1 once the title has fully moved into the bar. */
export function collapseProgress(scrollTop: number, range: number = COLLAPSE_RANGE): number {
  if (range <= 0) return scrollTop > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, scrollTop / range));
}

/** The title is shown in the bar once more than half of it has collapsed. */
export function isTitleInBar(progress: number): boolean {
  return progress >= 0.5;
}
