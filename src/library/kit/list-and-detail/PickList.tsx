import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import './records.css';

export type PickListItem = {
  id: string;
  title: string;
  /** Secondary line: tag, owner, due date. */
  meta?: ReactNode;
  /** Leading icon chip or avatar. */
  leading?: ReactNode;
  /** Trailing status or value. */
  trailing?: ReactNode;
  /** State of the record: an edge bar in most looks, a filled row in signal. */
  tone?: Tone;
};

type PickListProps = {
  /** Accessible name: "Equipment". */
  label: string;
  items: readonly PickListItem[];
  /** Id of the selected record. */
  selected?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

/** A list whose rows choose the record shown next to it: the master side of master-detail. */
export function PickList({ label, items, selected, onSelect, className }: PickListProps) {
  const look = useLook();
  return (
    <ul aria-label={label} data-look={look} className={cx('rec-pick', className)}>
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" data-tone={item.tone ?? 'neutral'} className="rec-pick-row" aria-pressed={item.id === selected} onClick={() => onSelect?.(item.id)}>
            {item.leading}
            <span className="rec-pick-text">
              <span className="rec-pick-title">{item.title}</span>
              {item.meta ? <span className="rec-pick-meta">{item.meta}</span> : null}
            </span>
            {item.trailing ? <span className="rec-pick-trailing">{item.trailing}</span> : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
