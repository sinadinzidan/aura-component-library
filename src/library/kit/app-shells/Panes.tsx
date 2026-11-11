import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './shells.css';

type PanesProps = {
  /** Column tracks, left to right: `'16rem minmax(0, 1fr) 20rem'`. */
  columns: string;
  /** Names the group of regions, for example "Asset browser". */
  label?: string;
  /** Layout classes. */
  className?: string;
  /** `Pane` elements. */
  children: ReactNode;
};

/**
 * Regions of a shell side by side: tree, list and record, or content and inspector. The look
 * decides how they meet — hairlines in studio and console, floating cards in soft and glass, ruled
 * columns in editorial.
 */
export function Panes({ columns, label, className, children }: PanesProps) {
  const look = useLook();
  return (
    <div role={label ? 'group' : undefined} aria-label={label} data-look={look} style={{ gridTemplateColumns: columns }} className={cx('shell-panes', className)}>
      {children}
    </div>
  );
}
