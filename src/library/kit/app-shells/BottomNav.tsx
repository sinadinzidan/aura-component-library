import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './shells.css';

export type BottomNavItem = { id: string; label: string; icon: ReactNode; badge?: string };

type BottomNavProps = {
  /** Accessible name: "Primary". */
  label: string;
  /** Three to five destinations. */
  items: readonly BottomNavItem[];
  current?: string;
  onNavigate?: (id: string) => void;
  className?: string;
};

/** Primary navigation on a phone: icon and word for each destination, docked to the bottom edge. */
export function BottomNav({ label, items, current, onNavigate, className }: BottomNavProps) {
  const look = useLook();
  return (
    <nav aria-label={label}>
      <ul data-look={look} className={cx('shell-bottomnav', className)}>
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" className="shell-bottomnav-item" aria-current={item.id === current ? 'page' : undefined} onClick={() => onNavigate?.(item.id)}>
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? <span className="shell-bottomnav-badge">{item.badge}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
