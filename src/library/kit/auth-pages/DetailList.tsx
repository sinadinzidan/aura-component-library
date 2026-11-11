import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

export type DetailItem = { label: string; value: ReactNode };

type DetailListProps = {
  items: readonly DetailItem[];
  /** `rows` puts label and value on one ruled line; `columns` stacks them in a grid of figures. */
  layout?: 'rows' | 'columns';
  /** Number of columns in the `columns` layout. */
  columns?: number;
  className?: string;
};

/**
 * Facts as label and value pairs: who signed in from where, what an error page knows, what a
 * record holds. Rules and type come from the look.
 */
export function DetailList({ items, layout = 'rows', columns = 2, className }: DetailListProps) {
  const look = useLook();
  if (layout === 'columns') {
    return (
      <dl data-look={look} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} className={cx('grid gap-x-6 gap-y-4', className)}>
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 flex-col gap-0.5 border-t border-(--kit-rule) pt-2.5">
            <dt className="text-xs text-(color:--kit-text-3)">{item.label}</dt>
            <dd className="text-sm font-medium text-(color:--kit-text) tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl data-look={look} className={cx('flex flex-col', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-6 border-b border-(--kit-rule) py-2.5 last:border-b-0">
          <dt className="shrink-0 text-sm text-(color:--kit-text-2)">{item.label}</dt>
          <dd className="min-w-0 text-right text-sm font-medium text-(color:--kit-text) tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
