export const DEFAULT_ZOOM_STEPS = [50, 75, 100, 125, 150, 200] as const;

/** The next zoom level in a direction, or the current one when there is none. */
export function stepZoom(zoom: number, direction: 'in' | 'out', steps: readonly number[] = DEFAULT_ZOOM_STEPS): number {
  const sorted = [...steps].sort((a, b) => a - b);
  if (direction === 'in') return sorted.find((step) => step > zoom) ?? zoom;
  return sorted.reverse().find((step) => step < zoom) ?? zoom;
}
