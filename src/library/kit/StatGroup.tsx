import type { CSSProperties, ReactNode } from 'react';

import type { LookId } from '../looks/looks';
import { useLook } from '../looks/useLook';

import { cx } from './tones';

/** Looks that draw a row of figures as one ruled surface instead of separate tiles. */
const JOINED_BY_DEFAULT: Record<LookId, boolean> = {
  studio: false,
  console: true,
  poster: false,
  glass: false,
  editorial: true,
  soft: false,
  blueprint: false,
  signal: false,
};

type StatGroupProps = {
  /** `Stat` elements. In a joined group pass them with `variant="plain"`. */
  children: ReactNode;
  columns?: number;
  /** One surface with dividers instead of separate tiles. Leave out to let the look choose. */
  joined?: boolean;
  /** Names the group for assistive technology, for example "Plant KPIs". */
  label?: string;
  className?: string;
};

/** A row of figures that share a rhythm: equal columns, aligned baselines, one gap or one rule. */
export function StatGroup({ children, columns = 4, joined, label, className }: StatGroupProps) {
  const look = useLook();
  const style: CSSProperties = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  return (
    <div role="group" aria-label={label} data-look={look} data-joined={joined ?? JOINED_BY_DEFAULT[look]} style={style} className={cx('kit-stats', className)}>
      {children}
    </div>
  );
}
