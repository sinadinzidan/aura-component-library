import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './shells.css';

export type TabStripItem = { id: string; label: string; icon?: ReactNode; count?: string };

type TabStripProps = {
  /** Accessible name: "Record sections". */
  label: string;
  items: readonly TabStripItem[];
  /** Id of the selected tab. */
  value: string;
  onChange?: (id: string) => void;
  className?: string;
};

/**
 * Secondary navigation inside a page. The look decides the anatomy: an accent underline in
 * studio, joined blocks in console and poster, a pill track in soft and glass, numbered entries
 * under a rule in editorial, drawing tabs on a blueprint.
 */
export function TabStrip({ label, items, value, onChange, className }: TabStripProps) {
  const look = useLook();
  return (
    <div role="tablist" aria-label={label} data-look={look} className={cx('shell-tabs', className)}>
      {items.map((item) => (
        <button key={item.id} type="button" role="tab" aria-selected={item.id === value} tabIndex={item.id === value ? 0 : -1} className="shell-tab" onClick={() => onChange?.(item.id)}>
          {item.icon}
          <span>{item.label}</span>
          {item.count ? <span className="shell-tab-count">{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
