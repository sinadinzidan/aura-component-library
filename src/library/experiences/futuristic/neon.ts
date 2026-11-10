import type { Tone } from '../../industrial/status';

/**
 * Colour vocabulary of the futuristic parts. Every part draws with one CSS variable, `--neon`,
 * so a line, its glow and its tint always agree. `accent` is the active theme's accent; the
 * others are Aura's status colours, used only when the thing drawn is in that state.
 */
export type NeonTone = 'accent' | 'success' | 'warning' | 'critical' | 'info' | 'neutral';

/** Sets `--neon` on an element. Children read it through the `NEON_*` class constants. */
export const NEON_TONE: Record<NeonTone, string> = {
  accent: '[--neon:var(--primary-background)]',
  success: '[--neon:var(--success-foreground-strong)]',
  warning: '[--neon:var(--warning-foreground-strong)]',
  critical: '[--neon:var(--critical-foreground-strong)]',
  info: '[--neon:var(--info-foreground-strong)]',
  neutral: '[--neon:var(--muted-foreground)]',
};

export const NEON_TEXT = 'text-[color:var(--neon)]';
export const NEON_TEXT_GLOW = '[text-shadow:0_0_10px_color-mix(in_oklab,var(--neon)_55%,transparent)]';
export const NEON_STROKE = 'stroke-[color:var(--neon)]';
export const NEON_FILL = 'fill-[var(--neon)]';
export const NEON_FILL_SOFT = 'fill-[color-mix(in_oklab,var(--neon)_14%,transparent)]';
export const NEON_BORDER = 'border-[color:color-mix(in_oklab,var(--neon)_55%,transparent)]';
export const NEON_BOX_GLOW =
  'shadow-[0_0_18px_color-mix(in_oklab,var(--neon)_22%,transparent),inset_0_0_18px_color-mix(in_oklab,var(--neon)_8%,transparent)]';
/** Glow for SVG marks. A filter, so it follows the shape of the stroke. */
export const NEON_SVG_GLOW = '[filter:drop-shadow(0_0_4px_color-mix(in_oklab,var(--neon)_75%,transparent))]';
export const NEON_SURFACE = 'bg-[color-mix(in_oklab,var(--neon)_7%,var(--base-background))]';

/**
 * Neon tone for an industrial status tone. Normal (neutral or success) draws in the accent, so
 * a screen full of healthy equipment is one colour and anything abnormal stands out.
 */
export function neonFromStatus(tone: Tone): NeonTone {
  if (tone === 'neutral' || tone === 'success') return 'accent';
  return tone;
}
