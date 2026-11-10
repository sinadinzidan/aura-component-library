import type { Tone } from '../../industrial/status';

/**
 * Colour vocabulary of the isometric parts. Every solid draws from one CSS variable, `--iso`,
 * mixed into the card surface in three strengths — one per visible face — so a shape reads as
 * lit from above in light and dark themes and follows whatever token the tone points at.
 */
export type IsoTone = 'neutral' | 'accent' | 'success' | 'warning' | 'critical' | 'info' | 'gas' | 'liquid' | 'water';

/** Sets `--iso` on an element. */
export const ISO_TONE: Record<IsoTone, string> = {
  neutral: '[--iso:var(--muted-foreground)]',
  accent: '[--iso:var(--primary-background)]',
  success: '[--iso:var(--success-foreground-strong)]',
  warning: '[--iso:var(--warning-foreground-strong)]',
  critical: '[--iso:var(--critical-foreground-strong)]',
  info: '[--iso:var(--info-foreground-strong)]',
  gas: '[--iso:var(--chart-1-450)]',
  liquid: '[--iso:var(--chart-2-450)]',
  water: '[--iso:var(--chart-3-450)]',
};

/** `solid` is a lit body; `ghost` is a faint outline for things that are not the subject. */
export type IsoVariant = 'solid' | 'ghost';

/** Face fills, lightest on top. In dark themes more tint is lighter, so the strengths swap. */
export const ISO_FACE_TOP = 'fill-[color-mix(in_oklab,var(--iso)_16%,var(--card-background))] dark:fill-[color-mix(in_oklab,var(--iso)_52%,var(--card-background))]';
export const ISO_FACE_LEFT = 'fill-[color-mix(in_oklab,var(--iso)_32%,var(--card-background))] dark:fill-[color-mix(in_oklab,var(--iso)_34%,var(--card-background))]';
export const ISO_FACE_RIGHT = 'fill-[color-mix(in_oklab,var(--iso)_50%,var(--card-background))] dark:fill-[color-mix(in_oklab,var(--iso)_18%,var(--card-background))]';
export const ISO_FACE_GHOST = 'fill-[color-mix(in_oklab,var(--iso)_7%,transparent)]';

export const ISO_EDGE = 'stroke-[color-mix(in_oklab,var(--iso)_70%,var(--base-foreground))]';
export const ISO_EDGE_GHOST = 'stroke-[color-mix(in_oklab,var(--iso)_45%,transparent)]';
export const ISO_EDGE_OUTLINED = 'stroke-[color:var(--primary-background)]';
export const ISO_GLOW = '[filter:drop-shadow(0_0_6px_color-mix(in_oklab,var(--primary-background)_70%,transparent))]';

/** Isometric tone for an industrial status tone. */
export function isoToneFromStatus(tone: Tone): IsoTone {
  return tone;
}

/** Edge class for a variant, with the selection outline winning. */
export function isoEdgeClass(variant: IsoVariant, outlined: boolean): string {
  if (outlined) return ISO_EDGE_OUTLINED;
  return variant === 'ghost' ? ISO_EDGE_GHOST : ISO_EDGE;
}
