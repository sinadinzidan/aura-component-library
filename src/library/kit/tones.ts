/**
 * One vocabulary for colour in the kit. Status tones say how something is doing, `accent` is the
 * theme's own colour, and the family tones tell categories apart. `looks.css` turns a tone into
 * soft, solid and line colours that fit the active look and mode.
 */
export const STATUS_TONES = ['neutral', 'success', 'warning', 'critical', 'info'] as const;
export type StatusTone = (typeof STATUS_TONES)[number];

export const FAMILY_TONES = ['blue', 'teal', 'green', 'purple', 'amber', 'pink', 'sky'] as const;
export type FamilyTone = (typeof FAMILY_TONES)[number];

export type Tone = StatusTone | FamilyTone | 'accent';

/** The colour a tone plots in: a CSS variable defined per look and mode. */
export function toneLine(tone: Tone): string {
  return `var(--kit-line-${tone})`;
}

/** Joins class names, skipping empty ones. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Formats a number with a fixed number of decimals and thin grouping, for figures and axes. */
export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-GB', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
