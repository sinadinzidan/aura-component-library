import type { ReactNode } from 'react';

import type { LookId } from '../looks/looks';
import { useLook } from '../looks/useLook';

import { cx, type Tone } from './tones';

type PillVariant = 'filled' | 'soft' | 'outline';

const LOOK_VARIANT: Record<LookId, PillVariant> = {
  studio: 'soft',
  console: 'filled',
  poster: 'filled',
  glass: 'soft',
  editorial: 'outline',
  soft: 'soft',
  blueprint: 'outline',
  signal: 'filled',
};

type StatusPillProps = {
  /** The state as a word: "Running", "Tripped", "Watch". */
  children: ReactNode;
  tone?: Tone;
  /** An icon instead of the default dot. */
  icon?: ReactNode;
  /** Leave out to let the look choose: soft in studio, filled blocks in console, outline on a blueprint. */
  variant?: PillVariant;
  size?: 'md' | 'lg';
  className?: string;
};

/** A state shown as colour, shape and a word together — never as a lone dot. */
export function StatusPill({ children, tone = 'neutral', icon, variant, size = 'md', className }: StatusPillProps) {
  const look = useLook();
  return (
    <span
      data-look={look}
      data-tone={tone}
      data-variant={variant ?? LOOK_VARIANT[look]}
      data-size={size}
      className={cx('kit-pill', className)}
    >
      {icon ?? <span aria-hidden="true" className="kit-pill-dot" />}
      {children}
    </span>
  );
}
