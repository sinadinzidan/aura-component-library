import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import './shells.css';

export type SubNavItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** A second line under the label: what the destination holds. */
  hint?: string;
  /** A count at the end, already formatted. */
  count?: string;
  /** Colours the count when it reports a state, such as open alarms. */
  tone?: Tone;
};

export type SubNavGroup = { id: string; label?: string; items: readonly SubNavItem[] };

type SubNavProps = {
  /** Accessible name of the navigation: "Settings sections". */
  label: string;
  groups: readonly SubNavGroup[];
  /** Id of the current item. */
  current?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

/**
 * Secondary navigation for a pane: settings sections, an asset tree level, saved views. The look
 * marks the current item — an accent wash in studio, an edge bar in console, a pill in soft.
 */
export function SubNav({ label, groups, current, onSelect, className }: SubNavProps) {
  const look = useLook();
  return (
    <nav aria-label={label} data-look={look} className={cx('shell-subnav', className)}>
      {groups.map((group) => (
        <div key={group.id} className="shell-subnav-group">
          {group.label ? <p className="shell-subnav-heading">{group.label}</p> : null}
          <ul className="shell-subnav-list">
            {group.items.map((item) => (
              <li key={item.id}>
                <button type="button" className="shell-subnav-item" aria-current={item.id === current ? 'true' : undefined} onClick={() => onSelect?.(item.id)}>
                  {item.icon}
                  <span className="shell-subnav-text">
                    <span>{item.label}</span>
                    {item.hint ? <span className="shell-subnav-hint">{item.hint}</span> : null}
                  </span>
                  {item.count ? (
                    <span data-tone={item.tone ?? 'neutral'} className="shell-subnav-count">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
