import { cx, type Tone } from '../tones';

import type { StateShape } from './status';

type StateGlyphProps = {
  shape: StateShape;
  tone: Tone;
  /** Edge length in px. */
  size?: number;
  /** A ring around the glyph for states that need someone to act. Static, never animated. */
  attention?: boolean;
  /** Draw in the surrounding text colour, for glyphs on a filled tile. */
  ink?: boolean;
  /** Accessible name. Leave out when a word next to the glyph already says the state. */
  label?: string;
  className?: string;
};

const SHAPES: Record<StateShape, string> = {
  circle: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17Z',
  ring: 'M12 3.5a8.5 8.5 0 1 0 0 17a8.5 8.5 0 0 0 0-17Zm0 4.2a4.3 4.3 0 1 1 0 8.6a4.3 4.3 0 0 1 0-8.6Z',
  square: 'M5 5h14v14H5Z',
  triangle: 'M12 3.2L21.6 20H2.4Z',
  diamond: 'M12 2.6L21.4 12L12 21.4L2.6 12Z',
  cross: 'M7.2 4.4L12 9.2l4.8-4.8l2.8 2.8L14.8 12l4.8 4.8l-2.8 2.8L12 14.8l-4.8 4.8l-2.8-2.8L9.2 12L4.4 7.2Z',
  bar: 'M4 9.5h16v5H4Z',
};

/**
 * A state as a filled shape. Each state of a vocabulary has its own outline — circle, ring,
 * square, diamond, triangle, cross — so it reads without colour and in a monochrome print.
 */
export function StateGlyph({ shape, tone, size = 14, attention = false, ink = false, label, className }: StateGlyphProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-tone={tone}
      data-shape={shape}
      data-attention={attention}
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full align-middle', className)}
      style={{ width: size, height: size, boxShadow: attention ? `0 0 0 ${Math.max(3, size / 4)}px color-mix(in oklab, var(--t-line) 28%, transparent)` : undefined }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <path d={SHAPES[shape]} fillRule="evenodd" style={{ fill: ink ? 'currentColor' : 'var(--t-line)' }} />
      </svg>
    </span>
  );
}
