import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './records.css';

type SelectionBarProps = {
  /** Number of selected records. */
  count: number;
  /** What the records are, singular and plural: `['work order', 'work orders']`. */
  noun: readonly [string, string];
  /** Buttons that act on the selection. */
  actions?: ReactNode;
  className?: string;
};

/** Replaces a list's toolbar while records are selected: how many, and what can be done with them. */
export function SelectionBar({ count, noun, actions, className }: SelectionBarProps) {
  const look = useLook();
  return (
    <div role="status" data-look={look} className={cx('rec-selection', className)}>
      <span className="rec-selection-count">
        {count} {count === 1 ? noun[0] : noun[1]} selected
      </span>
      {actions ? <div className="rec-selection-actions">{actions}</div> : null}
    </div>
  );
}
