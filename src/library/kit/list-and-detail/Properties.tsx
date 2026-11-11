import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './records.css';

export type PropertyItem = { label: string; value: ReactNode };

type PropertiesProps = {
  /** Accessible name: "Asset properties". */
  label: string;
  items: readonly PropertyItem[];
  /** `rows` puts label and value on one ruled line; `stacked` puts the label above a larger value. */
  layout?: 'rows' | 'stacked';
  columns?: 1 | 2 | 3 | 4;
  className?: string;
};

/**
 * The facts of a record as label and value pairs. Looks rule, stripe or pill the rows; values use
 * tabular figures so numbers line up.
 */
export function Properties({ label, items, layout = 'rows', columns = 1, className }: PropertiesProps) {
  const look = useLook();
  return (
    <dl aria-label={label} data-look={look} data-layout={layout} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} className={cx('rec-props', className)}>
      {items.map((item) => (
        <div key={item.label} className="rec-prop">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
