import type { ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { cx, type Tone } from './tones';

type IconChipProps = {
  /** The icon element, for example `<IconFlame />`. Decorative: the label next to it names it. */
  children: ReactNode;
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/**
 * An icon on a coloured ground: a tinted rounded square in studio, a solid block in console and
 * poster, a glowing glass tile, an outlined circle on a blueprint.
 */
export function IconChip({ children, tone = 'accent', size = 'md', className }: IconChipProps) {
  const look = useLook();
  return (
    <span aria-hidden="true" data-look={look} data-tone={tone} data-size={size} className={cx('kit-chip', className)}>
      {children}
    </span>
  );
}
