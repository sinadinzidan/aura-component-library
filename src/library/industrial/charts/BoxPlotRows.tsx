import { cn } from '../../../lib/utils';
import { formatReading, formatValue } from '../status';

import type { BoxStats } from './stats';
import { niceTicks } from './stats';

export type BoxPlotRow = {
  label: string;
  /** Five-number summary, e.g. from `boxStats`. */
  stats: BoxStats;
  /** Marks the row as out of range. Leave out while the spread is inside its limits. */
  tone?: 'warning' | 'critical';
};

export type BoxPlotRowsProps = {
  /** What is compared, with the key finding. Becomes the accessible name of the list. */
  label: string;
  rows: readonly BoxPlotRow[];
  /** Shared value range. Defaults to the smallest minimum and largest maximum. */
  domain?: readonly [number, number];
  unit?: string;
  decimals?: number;
  /** A dashed, labelled line across all rows. */
  limit?: { value: number; label: string; tone?: 'warning' | 'critical' | 'neutral' };
  /** Tailwind width of the name column, e.g. `w-36`. */
  labelClassName?: string;
  summary?: string;
  className?: string;
};

const BOX = {
  neutral: 'border-chart-1-450 bg-chart-1-200',
  warning: 'border-chart-warning-450 bg-chart-warning-200',
  critical: 'border-chart-critical-450 bg-chart-critical-200',
} as const;

const MEDIAN = { neutral: 'bg-chart-1-450', warning: 'bg-chart-warning-450', critical: 'bg-chart-critical-450' } as const;

const LIMIT_BORDER = {
  neutral: 'border-chart-neutral-450',
  warning: 'border-chart-warning-450',
  critical: 'border-chart-critical-450',
} as const;

/**
 * Box-plot rows: one line per asset with its minimum-to-maximum whisker, the middle half as a box
 * and the median as a tick, all on one shared scale. Compares spread between assets without a
 * chart library; rows that leave their limits can take a status tone.
 */
export function BoxPlotRows({ label, rows, domain, unit, decimals = 1, limit, labelClassName = 'w-36', summary, className }: BoxPlotRowsProps) {
  const lowest = Math.min(...rows.map((row) => row.stats.min), ...(limit ? [limit.value] : []));
  const highest = Math.max(...rows.map((row) => row.stats.max), ...(limit ? [limit.value] : []));
  const ticks = domain ? niceTicks(domain[0], domain[1]).filter((tick) => tick >= domain[0] && tick <= domain[1]) : niceTicks(lowest, highest);
  const min = domain ? domain[0] : (ticks[0] ?? 0);
  const max = domain ? domain[1] : (ticks[ticks.length - 1] ?? 1);
  const span = max - min || 1;
  const at = (value: number) => Math.min(100, Math.max(0, ((value - min) / span) * 100));

  return (
    <figure data-slot="box-plot-rows" className={cn('m-0 flex w-full min-w-0 flex-col gap-2', className)}>
      <div className="flex w-full">
        <div className={cn('shrink-0', labelClassName)} />
        <div className="relative min-w-0 flex-1">
          {limit ? (
            <span
              data-slot="box-plot-limit"
              aria-hidden="true"
              className={cn('pointer-events-none absolute inset-y-0 z-10 border-l border-dashed', LIMIT_BORDER[limit.tone ?? 'warning'])}
              style={{ left: `${at(limit.value)}%` }}
            >
              <span className={cn('absolute -top-5 text-xs whitespace-nowrap text-muted-foreground', at(limit.value) > 70 ? 'right-0' : 'left-0')}>{limit.label}</span>
            </span>
          ) : null}
          <ul aria-label={label} className={cn('flex flex-col', limit && 'mt-5')}>
            {rows.map((row) => {
              const tone = row.tone ?? 'neutral';
              return (
                <li
                  key={row.label}
                  data-slot="box-plot-row"
                  data-tone={tone}
                  className="relative flex h-8 items-center"
                  title={`${row.label}: median ${formatReading(row.stats.median, unit, decimals)}, middle half ${formatValue(row.stats.q1, decimals)} to ${formatValue(row.stats.q3, decimals)}, range ${formatValue(row.stats.min, decimals)} to ${formatValue(row.stats.max, decimals)}`}
                >
                  <span className={cn('absolute right-full truncate pr-3 text-right text-xs text-muted-foreground', labelClassName)}>{row.label}</span>
                  <span className="sr-only">
                    median {formatReading(row.stats.median, unit, decimals)}, range {formatValue(row.stats.min, decimals)} to {formatValue(row.stats.max, decimals)}
                  </span>
                  <span
                    data-slot="box-plot-whisker"
                    className="absolute h-px bg-chart-neutral-450"
                    style={{ left: `${at(row.stats.min)}%`, width: `${at(row.stats.max) - at(row.stats.min)}%` }}
                  />
                  <span
                    data-slot="box-plot-box"
                    className={cn('absolute h-3.5 rounded-xs border', BOX[tone])}
                    style={{ left: `${at(row.stats.q1)}%`, width: `${at(row.stats.q3) - at(row.stats.q1)}%` }}
                  />
                  <span data-slot="box-plot-median" className={cn('absolute h-5 w-0.5 -translate-x-1/2', MEDIAN[tone])} style={{ left: `${at(row.stats.median)}%` }} />
                </li>
              );
            })}
          </ul>
          <div className="relative mt-1 h-5 border-t border-chart-gridlines text-xs text-muted-foreground tabular-nums" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick} className="absolute top-1.5 -translate-x-1/2 leading-none" style={{ left: `${at(tick)}%` }}>
                {formatValue(tick, Number.isInteger(tick) ? 0 : decimals)}
              </span>
            ))}
          </div>
        </div>
        {unit ? <span className="w-10 shrink-0 self-end pb-0.5 pl-2 text-xs leading-none text-muted-foreground">{unit}</span> : null}
      </div>
      {summary ? <figcaption className="text-xs text-muted-foreground">{summary}</figcaption> : null}
    </figure>
  );
}
