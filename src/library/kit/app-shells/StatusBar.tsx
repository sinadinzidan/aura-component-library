import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import './shells.css';

export type StatusBarItem = {
  id: string;
  label: string;
  /** The reading, already formatted. */
  value?: string;
  /** A state colours the item: a mark in most looks, the whole cell in console. */
  tone?: Tone;
  icon?: ReactNode;
};

type StatusBarProps = {
  /** Accessible name: "System status". */
  label: string;
  items: readonly StatusBarItem[];
  /** Items pushed to the end: clock, user, version. */
  end?: readonly StatusBarItem[];
  className?: string;
};

function StatusBarCell({ item }: { item: StatusBarItem }) {
  const tone = item.tone ?? 'neutral';
  return (
    <span data-tone={tone} className="shell-statusbar-item">
      {item.icon ?? (tone === 'neutral' ? null : <span aria-hidden="true" className="shell-statusbar-mark" />)}
      <span>{item.label}</span>
      {item.value ? <span className="shell-statusbar-value">{item.value}</span> : null}
    </span>
  );
}

/** A strip docked to the bottom of a shell with facts that are always true of the session: connection, mode, counts, clock. */
export function StatusBar({ label, items, end = [], className }: StatusBarProps) {
  const look = useLook();
  return (
    <footer aria-label={label} data-look={look} className={cx('shell-statusbar', className)}>
      {items.map((item) => (
        <StatusBarCell key={item.id} item={item} />
      ))}
      {end.length > 0 ? (
        <span className="shell-statusbar-end">
          {end.map((item) => (
            <StatusBarCell key={item.id} item={item} />
          ))}
        </span>
      ) : null}
    </footer>
  );
}
