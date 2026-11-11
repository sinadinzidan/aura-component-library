import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type DashFooterItem = { label: string; value: string };

type DashFooterProps = {
  /** Facts about the data: source, period, refresh time. */
  items: readonly DashFooterItem[];
  /** A sentence that qualifies the figures, such as how a number is calculated. */
  note?: string;
  /** End of the strip: an export or a link to the source. */
  actions?: ReactNode;
  className?: string;
};

/**
 * The closing strip of a dashboard: where the data comes from, which period it covers and when
 * it was refreshed, so a screenshot of the board still explains itself.
 */
export function DashFooter({ items, note, actions, className }: DashFooterProps) {
  const look = useLook();
  return (
    <footer data-look={look} className={cx('flex min-w-0 flex-wrap items-center gap-x-8 gap-y-3 border-t border-(--kit-rule-strong) pt-4 text-sm', className)}>
      <dl className="flex flex-wrap gap-x-8 gap-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col">
            <dt className="text-xs leading-4 text-(--kit-text-2)">{item.label}</dt>
            <dd className="leading-5 font-medium text-(--kit-text) tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      {note ? <p className="min-w-48 flex-1 leading-5 text-(--kit-text-2)">{note}</p> : <span className="flex-1" />}
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </footer>
  );
}
