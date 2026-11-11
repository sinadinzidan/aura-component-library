export type SplitLimits = {
  /** Smallest share of the width the first pane may take, in percent. */
  min: number;
  /** Largest share, in percent. */
  max: number;
  /** Change per arrow key press, in percent. */
  step: number;
};

export const DEFAULT_SPLIT_LIMITS: SplitLimits = { min: 25, max: 75, step: 5 };

/** Keeps a ratio inside its limits. Anything that is not a number becomes the midpoint. */
export function clampRatio(ratio: number, limits: SplitLimits = DEFAULT_SPLIT_LIMITS): number {
  if (!Number.isFinite(ratio)) return (limits.min + limits.max) / 2;
  return Math.min(limits.max, Math.max(limits.min, ratio));
}

/** The first pane's share for a pointer at `clientX` over a container that starts at `left` and is `width` wide. */
export function ratioFromPointer(clientX: number, left: number, width: number, limits: SplitLimits = DEFAULT_SPLIT_LIMITS): number {
  if (width <= 0) return clampRatio(Number.NaN, limits);
  return clampRatio(Math.round(((clientX - left) / width) * 1000) / 10, limits);
}

/**
 * The ratio after a key press on the divider: arrows move one step, Page keys three, Home and End
 * jump to the limits. Returns `null` for a key the divider does not handle, so it can pass through.
 */
export function ratioFromKey(key: string, ratio: number, limits: SplitLimits = DEFAULT_SPLIT_LIMITS): number | null {
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      return clampRatio(ratio - limits.step, limits);
    case 'ArrowRight':
    case 'ArrowDown':
      return clampRatio(ratio + limits.step, limits);
    case 'PageUp':
      return clampRatio(ratio - limits.step * 3, limits);
    case 'PageDown':
      return clampRatio(ratio + limits.step * 3, limits);
    case 'Home':
      return limits.min;
    case 'End':
      return limits.max;
    default:
      return null;
  }
}

/** What a screen reader hears after a resize. */
export function describeSplit(ratio: number, startLabel: string, endLabel: string): string {
  const start = Math.round(ratio);
  return `${startLabel} ${start} percent, ${endLabel} ${100 - start} percent`;
}
