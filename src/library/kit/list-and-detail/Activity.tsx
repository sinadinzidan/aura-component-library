import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import './records.css';

export type ActivityItem = {
  id: string;
  /** What happened: "Work order created". */
  title: string;
  /** Who or what did it. */
  actor?: string;
  /** When, already formatted. */
  time: string;
  /** A note, a comment, a reading. */
  body?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
};

type ActivityProps = {
  /** Accessible name: "Work order history". */
  label: string;
  /** Newest first or oldest first; the feed keeps the given order. */
  items: readonly ActivityItem[];
  className?: string;
};

/**
 * What happened to a record, in order. A rail of toned marks in most looks, a dated column in
 * editorial, filled state rows in signal.
 */
export function Activity({ label, items, className }: ActivityProps) {
  const look = useLook();
  return (
    <ol aria-label={label} data-look={look} className={cx('rec-activity', className)}>
      {items.map((item) => (
        <li key={item.id} data-tone={item.tone ?? 'neutral'} className="rec-activity-item">
          <span aria-hidden="true" className="rec-activity-mark">
            {item.icon}
          </span>
          <div className="rec-activity-text">
            <p className="rec-activity-title">{item.title}</p>
            {item.actor ? <p className="rec-activity-actor">{item.actor}</p> : null}
            {item.body ? <div className="rec-activity-body">{item.body}</div> : null}
          </div>
          <span className="rec-activity-time">{item.time}</span>
        </li>
      ))}
    </ol>
  );
}
