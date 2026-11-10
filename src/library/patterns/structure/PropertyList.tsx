import type { ReactNode } from 'react';

export type Property = {
  /** The field name: "Functional location", "Due". */
  label: string;
  /** Text or a small component (badge, link, avatar with name). Missing values show a placeholder. */
  value?: ReactNode;
  /** Sits after the label, usually an `InfoTooltip`. */
  hint?: ReactNode;
  /** Sits after the value, usually a `CopyButton` or an edit button. */
  action?: ReactNode;
};

type PropertyListProps = {
  items: readonly Property[];
  /**
   * `inline`: label column on the left, value beside it, for side panels.
   * `stacked`: label above value, for narrow panels and long values.
   */
  layout?: 'inline' | 'stacked';
  /** Stacked properties in a grid, for wide panels and record headers. */
  columns?: 1 | 2 | 3;
  /** Shown for a missing value, so an empty field never looks like a rendering bug. */
  emptyValue?: string;
  /** Tighter rows for long technical lists. */
  dense?: boolean;
};

const COLUMNS: Record<NonNullable<PropertyListProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
};

function isMissing(value: ReactNode): boolean {
  return value === undefined || value === null || value === '' || value === false;
}

/**
 * The properties of one record as a description list. Labels share one column and values are
 * left-aligned beside them, so a long list scans as two straight edges; values may wrap. Use
 * `MetadataList` instead for the short label-left, value-right summary in a card.
 */
export function PropertyList({
  items,
  layout = 'inline',
  columns = 1,
  emptyValue = '—',
  dense = false,
}: PropertyListProps) {
  const stacked = layout === 'stacked';
  const listLayout = stacked
    ? `grid ${COLUMNS[columns]} gap-x-6 ${dense ? 'gap-y-2' : 'gap-y-4'}`
    : `flex flex-col ${dense ? 'gap-1' : 'gap-3'}`;
  const rowLayout = stacked ? 'flex min-w-0 flex-col gap-1' : 'grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start gap-4';

  return (
    <dl data-slot="property-list" className={`w-full min-w-0 text-sm ${listLayout}`}>
      {items.map((item) => (
        <div key={item.label} className={rowLayout}>
          <dt className={`flex min-h-5 items-center gap-1 text-muted-foreground ${stacked ? 'text-xs' : ''}`}>
            <span className="min-w-0 break-words">{item.label}</span>
            {item.hint}
          </dt>
          <dd className="flex min-h-5 min-w-0 items-center gap-2 text-base-foreground">
            <span className={`min-w-0 break-words ${isMissing(item.value) ? 'text-muted-foreground' : ''}`}>
              {isMissing(item.value) ? emptyValue : item.value}
            </span>
            {item.action}
          </dd>
        </div>
      ))}
    </dl>
  );
}
