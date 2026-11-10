export type BreakdownItem = {
  id: string;
  label: string;
  value: number;
  /** Quiet text after the label, such as a tag or an owner. */
  detail?: string;
};

type BreakdownListProps = {
  /** Accessible name, for example "Alarms by area". */
  label: string;
  items: readonly BreakdownItem[];
  unit?: string;
  decimals?: number;
  /** `max`: the largest item fills the bar, for ranking. `total`: bars are shares of the sum. */
  scale?: 'max' | 'total';
  /** Sorts largest first and numbers the rows: a "top five" list. */
  ranked?: boolean;
  /** Keeps the first N rows after sorting. */
  limit?: number;
  /** Adds each item's share of the total after its value. */
  showShare?: boolean;
  /** `stacked` puts the bar under the label; `inline` keeps label, bar and value on one line. */
  layout?: 'stacked' | 'inline';
  format?: (value: number) => string;
};

function defaultFormat(decimals: number): (value: number) => string {
  const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (value) => formatter.format(value);
}

/**
 * A list of categories with a bar each: how a total splits by area, type or owner, or a ranked
 * "top five". One neutral data colour for every bar, because the length already carries the
 * comparison; the exact number sits at the end of each row.
 */
export function BreakdownList({
  label,
  items,
  unit,
  decimals = 0,
  scale = 'max',
  ranked = false,
  limit,
  showShare = false,
  layout = 'stacked',
  format,
}: BreakdownListProps) {
  const formatValue = format ?? defaultFormat(decimals);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const ordered = ranked ? [...items].sort((a, b) => b.value - a.value) : [...items];
  const visible = limit === undefined ? ordered : ordered.slice(0, limit);
  const reference = scale === 'total' ? total : Math.max(...visible.map((item) => item.value), 0);
  const inline = layout === 'inline';

  return (
    <ol aria-label={label} className={`flex w-full flex-col ${inline ? 'gap-2' : 'gap-3'}`}>
      {visible.map((item, index) => {
        const width = reference > 0 ? Math.max(0, Math.min(100, (item.value / reference) * 100)) : 0;
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
        const name = (
          <span className="flex min-w-0 items-baseline gap-2">
            {ranked ? <span className="w-4 shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1}</span> : null}
            <span className="truncate text-sm text-base-foreground">{item.label}</span>
            {item.detail ? <span className="truncate text-xs text-muted-foreground">{item.detail}</span> : null}
          </span>
        );
        const figure = (
          <span className="shrink-0 whitespace-nowrap text-sm tabular-nums text-base-foreground">
            {formatValue(item.value)}
            {unit ? <span className="text-muted-foreground"> {unit}</span> : null}
            {showShare ? <span className="ml-2 inline-block w-9 text-right text-xs text-muted-foreground">{share}%</span> : null}
          </span>
        );
        const bar = (
          <span aria-hidden="true" className="block h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted-background">
            <span data-slot="breakdown-bar" className="block h-full rounded-full bg-chart-1-450" style={{ width: `${width}%` }} />
          </span>
        );

        return inline ? (
          <li key={item.id} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-3">
            {name}
            {bar}
            {figure}
          </li>
        ) : (
          <li key={item.id} className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-3">
              {name}
              {figure}
            </span>
            <span className="flex">{bar}</span>
          </li>
        );
      })}
    </ol>
  );
}
