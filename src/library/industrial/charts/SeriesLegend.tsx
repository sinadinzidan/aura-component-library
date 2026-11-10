import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

export type SeriesLegendItem = {
  key: string;
  label: string;
  /** A chart colour token, e.g. `chartSeriesColor(1)` or `var(--color-chart-neutral-300)`. */
  color: string;
  /** How the series is drawn, so the swatch matches the mark. */
  mark?: 'line' | 'dashed' | 'area' | 'bar' | 'dot';
  /** Current or cursor value printed after the label. `null` prints an em dash. */
  value?: number | null;
  unit?: string;
  decimals?: number;
};

export type SeriesLegendProps = {
  items: readonly SeriesLegendItem[];
  /** Keys of series that are switched off. */
  hiddenKeys?: readonly string[];
  /** Makes every entry a toggle button. Called with the key that was activated. */
  onToggle?: (key: string) => void;
  /** `row` wraps under a chart; `column` lists entries with right-aligned values beside one. */
  orientation?: 'row' | 'column';
  /** Accessible name of the list. */
  label?: string;
  className?: string;
};

function Swatch({ color, mark, muted }: { color: string; mark: NonNullable<SeriesLegendItem['mark']>; muted: boolean }) {
  const shape =
    mark === 'line' || mark === 'dashed'
      ? 'h-0 w-3 border-t-2'
      : mark === 'dot'
        ? 'size-2 rounded-full border'
        : 'size-2 rounded-xs border';
  const filled = mark === 'area' || mark === 'bar' || mark === 'dot';
  return (
    <span
      aria-hidden="true"
      data-slot="series-swatch"
      className={cn('shrink-0', shape, mark === 'dashed' && 'border-dashed', muted && 'opacity-40')}
      style={{ borderColor: color, backgroundColor: filled && !muted ? color : undefined }}
    />
  );
}

/**
 * Legend for a chart: a swatch that matches each series' mark, its name and optionally its current
 * value. With `onToggle` the entries become pressed/unpressed buttons that switch series on and off.
 */
export function SeriesLegend({
  items,
  hiddenKeys = [],
  onToggle,
  orientation = 'row',
  label = 'Legend',
  className,
}: SeriesLegendProps) {
  return (
    <ul
      aria-label={label}
      data-slot="series-legend"
      className={cn(
        'flex text-xs',
        orientation === 'row' ? 'flex-wrap items-center gap-x-4 gap-y-1' : 'flex-col gap-2',
        className
      )}
    >
      {items.map((item) => {
        const hidden = hiddenKeys.includes(item.key);
        const content = (
          <>
            <Swatch color={item.color} mark={item.mark ?? 'line'} muted={hidden} />
            <span className={cn('truncate', hidden ? 'text-muted-foreground line-through' : 'text-medium-foreground')}>
              {item.label}
            </span>
            {item.value !== undefined ? (
              <span
                data-slot="series-value"
                className={cn(
                  'whitespace-nowrap tabular-nums',
                  orientation === 'column' && 'ml-auto pl-4',
                  hidden ? 'text-muted-foreground' : 'font-medium text-base-foreground'
                )}
              >
                {formatValue(hidden ? null : item.value, item.decimals ?? 0)}
                {item.unit && item.value !== null && !hidden ? (
                  <span className="font-normal text-muted-foreground"> {item.unit}</span>
                ) : null}
              </span>
            ) : null}
          </>
        );
        return (
          <li key={item.key} className="flex min-w-0">
            {onToggle ? (
              <button
                type="button"
                aria-pressed={!hidden}
                onClick={() => onToggle(item.key)}
                className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm outline-none focus-visible:shadow-focus-ring"
              >
                {content}
              </button>
            ) : (
              <span className="flex min-w-0 flex-1 items-center gap-1.5">{content}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
