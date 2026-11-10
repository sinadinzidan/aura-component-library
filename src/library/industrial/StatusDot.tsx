import { cn } from '../../lib/utils';

import { TONE_BORDER, TONE_DOT } from './status';
import type { DotShape, Tone } from './status';

export type StatusDotProps = {
  tone: Tone;
  /** Repeats the state in shape, so it reads without colour. */
  shape?: DotShape;
  size?: 'sm' | 'md';
  /** Slow halo for a state that still needs someone's attention, such as an unacknowledged alarm. */
  pulse?: boolean;
  /**
   * Accessible name. Required whenever no visible label sits next to the dot; leave it out only
   * when the dot is decoration beside text that already says the state.
   */
  label?: string;
  className?: string;
};

const SIZE: Record<NonNullable<StatusDotProps['size']>, string> = { sm: 'size-2', md: 'size-2.5' };

function shapeClass(shape: DotShape, tone: Tone): string {
  switch (shape) {
    case 'ring':
      return cn('rounded-full border-2', TONE_BORDER[tone]);
    case 'square':
      // No radius: a themed radius would round a small square into a circle and lose the shape cue.
      return cn('rounded-none', TONE_DOT[tone]);
    case 'diamond':
      return cn('rotate-45 rounded-none', TONE_DOT[tone]);
    case 'dot':
      return cn('rounded-full', TONE_DOT[tone]);
  }
}

/**
 * The smallest status signal: a coloured, shaped dot. Never use it as the only carrier of a
 * state — pair it with text, or give it a `label` so it has an accessible name.
 */
export function StatusDot({ tone, shape = 'dot', size = 'md', pulse = false, label, className }: StatusDotProps) {
  return (
    <span
      data-slot="status-dot"
      data-tone={tone}
      data-shape={shape}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('relative inline-flex shrink-0 items-center justify-center', SIZE[size], className)}
    >
      {pulse ? (
        <span
          data-slot="status-dot-pulse"
          className={cn('absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping', TONE_DOT[tone])}
        />
      ) : null}
      <span className={cn('relative block size-full', shapeClass(shape, tone))} />
    </span>
  );
}
