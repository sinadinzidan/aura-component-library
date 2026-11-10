import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { NEON_TEXT, NEON_TEXT_GLOW, NEON_TONE } from './neon';
import type { NeonTone } from './neon';

export type GlowTextProps = {
  children: ReactNode;
  tone?: NeonTone;
  /** `label` is small, upper case and widely tracked, for panel titles and captions. */
  variant?: 'text' | 'label';
  /** Turns the halo off, for dense runs of text where it would smear. */
  glow?: boolean;
  /** Monospaced, for tags and figures. */
  mono?: boolean;
  className?: string;
};

/**
 * Text in the neon colour with a soft halo. The halo is a text shadow of the same colour, so the
 * glyphs themselves keep their full contrast. Use it for titles, captions and single figures —
 * body text stays in the normal foreground.
 */
export function GlowText({ children, tone = 'accent', variant = 'text', glow = true, mono = false, className }: GlowTextProps) {
  return (
    <span
      data-slot="glow-text"
      data-tone={tone}
      className={cn(
        NEON_TONE[tone],
        NEON_TEXT,
        glow && NEON_TEXT_GLOW,
        variant === 'label' && 'text-xs font-medium uppercase tracking-widest',
        mono && 'font-mono tabular-nums',
        className
      )}
    >
      {children}
    </span>
  );
}
