/**
 * Aura's motion reference as data: the four easing curves and the duration bands, each with the
 * Tailwind utility that applies it. Aura ships no `ease-*` or `duration-*` tokens of its own, so
 * these literals are the one place the curves are written down.
 */

export type EasingId = 'standard' | 'entrance' | 'exit' | 'sine';

export type Easing = {
  id: EasingId;
  name: string;
  /** The four control points, as written in DESIGN.md. */
  curve: string;
  /** Tailwind utility for transitions and animations. */
  className: string;
  use: string;
};

export const EASINGS: readonly Easing[] = [
  {
    id: 'standard',
    name: 'Standard',
    curve: 'cubic-bezier(0.40, 0.00, 0.15, 1.00)',
    className: 'ease-[cubic-bezier(0.40,0.00,0.15,1.00)]',
    use: 'Moving between two states in view',
  },
  {
    id: 'entrance',
    name: 'Entrance',
    curve: 'cubic-bezier(0.00, 0.00, 0.15, 1.00)',
    className: 'ease-[cubic-bezier(0.00,0.00,0.15,1.00)]',
    use: 'Appearing: decelerates into place',
  },
  {
    id: 'exit',
    name: 'Exit',
    curve: 'cubic-bezier(0.67, 0.00, 0.83, 0.83)',
    className: 'ease-[cubic-bezier(0.67,0.00,0.83,0.83)]',
    use: 'Leaving: accelerates away',
  },
  {
    id: 'sine',
    name: 'Sine',
    curve: 'cubic-bezier(0.33, 0.00, 0.67, 1.00)',
    className: 'ease-[cubic-bezier(0.33,0.00,0.67,1.00)]',
    use: 'Opacity fades and subtle colour shifts',
  },
];

export type DurationBand = {
  id: 'instant' | 'short' | 'medium' | 'long';
  name: string;
  ms: number;
  /** Tailwind utility. */
  className: string;
  use: string;
};

export const DURATIONS: readonly DurationBand[] = [
  { id: 'instant', name: 'Instant', ms: 100, className: 'duration-100', use: 'Hover and pressed feedback' },
  { id: 'short', name: 'Short', ms: 150, className: 'duration-150', use: 'Toggles, exits, small state changes' },
  { id: 'medium', name: 'Medium', ms: 200, className: 'duration-200', use: 'Menus, popovers, expand and collapse' },
  { id: 'long', name: 'Long', ms: 400, className: 'duration-[400ms]', use: 'Page-level and expressive entrances' },
];

/** Offset between items that enter in sequence. Exits never stagger. */
export const STAGGER_MS = 33;

export function findEasing(id: EasingId): Easing {
  return EASINGS.find((easing) => easing.id === id) ?? EASINGS[0];
}

/** Delay of the item at `index` in a staggered entrance, capped so long lists do not drag. */
export function staggerDelay(index: number, stepMs: number = STAGGER_MS, maxItems = 8): number {
  const clamped = Math.min(Math.max(Math.floor(index), 0), maxItems - 1);
  return clamped * stepMs;
}

const NBSP = String.fromCharCode(160);

/** "200 ms" under a second, "1.2 s" from there, with a non-breaking space before the unit. */
export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}${NBSP}ms`;
  return `${(ms / 1000).toFixed(1)}${NBSP}s`;
}
