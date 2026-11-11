/** Snap points and drag maths for a bottom sheet. Heights are fractions (0–1) of the screen. */

export type SheetSnap = 'closed' | 'half' | 'full';

/** Height of each snap point as a fraction of the screen. */
export const SNAP_FRACTION: Readonly<Record<SheetSnap, number>> = { closed: 0, half: 0.5, full: 0.9 };

const ORDER: readonly SheetSnap[] = ['closed', 'half', 'full'];

export type SheetAction =
  | { type: 'open' }
  | { type: 'expand' }
  | { type: 'collapse' }
  | { type: 'close' }
  | { type: 'toggle' }
  | { type: 'snapTo'; snap: SheetSnap };

/** Where a sheet that is `fraction` tall settles. Below a quarter it closes; above 70 % it opens fully. */
export function nearestSnap(fraction: number): SheetSnap {
  if (fraction < 0.25) return 'closed';
  return fraction < 0.7 ? 'half' : 'full';
}

/** The height after dragging the handle `deltaY` pixels down (positive) or up, kept between closed and full. */
export function dragFraction(startFraction: number, deltaY: number, screenHeight: number): number {
  if (screenHeight <= 0) return startFraction;
  return Math.min(SNAP_FRACTION.full, Math.max(0, startFraction - deltaY / screenHeight));
}

/** The next snap point up or down. Down from `half` closes; up from `full` stays. */
export function stepSnap(snap: SheetSnap, direction: 'up' | 'down'): SheetSnap {
  const index = ORDER.indexOf(snap) + (direction === 'up' ? 1 : -1);
  return ORDER[Math.min(ORDER.length - 1, Math.max(0, index))];
}

export function sheetReducer(snap: SheetSnap, action: SheetAction): SheetSnap {
  switch (action.type) {
    case 'open':
      return snap === 'closed' ? 'half' : snap;
    case 'expand':
      return snap === 'closed' ? 'half' : 'full';
    case 'collapse':
      return stepSnap(snap, 'down');
    case 'close':
      return 'closed';
    case 'toggle':
      return snap === 'half' ? 'full' : snap === 'full' ? 'half' : 'closed';
    case 'snapTo':
      return action.snap;
    default:
      return snap;
  }
}

/** Reads the snap point as a word, for `aria-valuetext`. */
export function snapLabel(snap: SheetSnap): string {
  return snap === 'closed' ? 'Closed' : snap === 'half' ? 'Half height' : 'Full height';
}
