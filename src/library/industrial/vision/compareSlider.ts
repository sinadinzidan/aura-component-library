/** Position of the divider of a before/after comparison, as a fraction (0–1) of the frame width. */

export const COMPARE_STEP = 0.02;
export const COMPARE_STEP_LARGE = 0.1;

export const clampDivider = (position: number): number => Math.min(1, Math.max(0, position));

/** Divider position for a pointer at `clientX` over a frame starting at `left` and `width` wide. */
export function dividerFromPointer(clientX: number, left: number, width: number): number {
  return width <= 0 ? 0.5 : clampDivider((clientX - left) / width);
}

/** The divider after a key press; `null` when the key does nothing, so the caller can leave it alone. */
export function dividerAfterKey(position: number, key: string, shift = false): number | null {
  const step = shift ? COMPARE_STEP_LARGE : COMPARE_STEP;
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return clampDivider(position - step);
    case 'ArrowRight':
    case 'ArrowUp':
      return clampDivider(position + step);
    case 'PageDown':
      return clampDivider(position - COMPARE_STEP_LARGE);
    case 'PageUp':
      return clampDivider(position + COMPARE_STEP_LARGE);
    case 'Home':
      return 0;
    case 'End':
      return 1;
    default:
      return null;
  }
}

/** CSS `clip-path` that shows only the part of the "after" layer to the right of the divider. */
export function afterClipPath(position: number): string {
  return `inset(0 0 0 ${Math.round(clampDivider(position) * 10000) / 100}%)`;
}

/** The divider as a whole percent, for `aria-valuenow`. */
export const dividerPercent = (position: number): number => Math.round(clampDivider(position) * 100);
