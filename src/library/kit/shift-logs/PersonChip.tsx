import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import { initialsOf } from './log';

type PersonChipProps = {
  name: string;
  /** Colour family, to tell people apart in a feed. */
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE = { sm: 28, md: 36, lg: 48 } as const;

/** Initials on a tinted disc (a square in the square looks), named for assistive technology. */
export function PersonChip({ name, tone = 'neutral', size = 'md', className }: PersonChipProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  return (
    <span
      role="img"
      aria-label={name}
      data-look={look}
      data-tone={tone}
      className={cx('inline-flex shrink-0 items-center justify-center font-semibold', className)}
      style={{ width: SIZE[size], height: SIZE[size], fontSize: size === 'lg' ? '1rem' : '0.75rem', borderRadius: square ? 0 : 999, background: 'var(--t-soft)', color: 'var(--t-on-soft)' }}
    >
      {initialsOf(name)}
    </span>
  );
}
