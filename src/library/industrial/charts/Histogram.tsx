import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

import type { Bin } from './stats';
import { niceTicks } from './stats';

export type HistogramLimit = { value: number; label: string; tone?: 'warning' | 'critical' | 'neutral' };

export type HistogramProps = {
  /** What the distribution is of, with the key finding. Becomes the accessible name. */
  label: string;
  /** Equal-width bins, lowest first, e.g. from `bucketize`. */
  bins: readonly Bin[];
  /** Unit of the measured value, printed with the axis. */
  unit?: string;
  decimals?: number;
  /** What a bar counts: "hours", "samples". Used in bar descriptions. */
  countLabel?: string;
  /** Dashed, labelled lines on the value axis. */
  limits?: readonly HistogramLimit[];
  /** Colours bins that lie entirely below `low` or above `high` as out of range. */
  outside?: { low?: number; high?: number; tone?: 'warning' | 'critical' };
  /** One line under the chart saying what it shows. */
  summary?: string;
  /** Tailwind height of the plot, e.g. `h-48`. */
  heightClassName?: string;
  className?: string;
};

const LIMIT_BORDER = {
  neutral: 'border-chart-neutral-450',
  warning: 'border-chart-warning-450',
  critical: 'border-chart-critical-450',
} as const;

const OUTSIDE_BG = { warning: 'bg-chart-warning-450', critical: 'bg-chart-critical-450' } as const;

/**
 * Histogram of a measurement: how long, or how often, the value sat in each range. Dependency-free
 * bars on chart tokens with optional limit lines, and bins beyond a limit picked out in status colour.
 */
export function Histogram({
  label,
  bins,
  unit,
  decimals = 0,
  countLabel = 'samples',
  limits = [],
  outside,
  summary,
  heightClassName = 'h-48',
  className,
}: HistogramProps) {
  const min = bins.length > 0 ? bins[0].from : 0;
  const max = bins.length > 0 ? bins[bins.length - 1].to : 1;
  const span = max - min || 1;
  const peak = Math.max(1, ...bins.map((bin) => bin.count));
  const countTicks = niceTicks(0, peak, 3);
  const top = countTicks[countTicks.length - 1] ?? peak;
  const valueTicks = niceTicks(min, max, 5).filter((tick) => tick >= min && tick <= max);
  const position = (value: number) => `${Math.min(100, Math.max(0, ((value - min) / span) * 100))}%`;
  const isOutside = (bin: Bin) =>
    (outside?.high !== undefined && bin.from >= outside.high) || (outside?.low !== undefined && bin.to <= outside.low);

  return (
    <figure data-slot="histogram" className={cn('m-0 flex w-full min-w-0 flex-col gap-2', className)}>
      <div role="img" aria-label={label} className="flex w-full gap-2">
        <div className={cn('relative w-8 shrink-0 text-xs text-muted-foreground tabular-nums', heightClassName)} aria-hidden="true">
          {countTicks.map((tick) => (
            <span key={tick} className="absolute right-0 translate-y-1/2 leading-none" style={{ bottom: `${(tick / top) * 100}%` }}>
              {formatValue(tick)}
            </span>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className={cn('relative w-full', heightClassName)}>
            {countTicks.map((tick) => (
              <span key={tick} aria-hidden="true" className="absolute inset-x-0 border-t border-chart-gridlines" style={{ bottom: `${(tick / top) * 100}%` }} />
            ))}
            <div className="absolute inset-0 flex items-end gap-px">
              {bins.map((bin) => (
                <span
                  key={bin.from}
                  data-slot="histogram-bar"
                  data-outside={isOutside(bin) ? 'true' : undefined}
                  title={`${formatValue(bin.from, decimals)}–${formatValue(bin.to, decimals)}${unit ? ` ${unit}` : ''}: ${formatValue(bin.count)} ${countLabel}`}
                  className={cn('min-w-0 flex-1 rounded-t-xs', isOutside(bin) ? OUTSIDE_BG[outside?.tone ?? 'warning'] : 'bg-chart-1-450')}
                  style={{ height: `${(bin.count / top) * 100}%` }}
                />
              ))}
            </div>
            {limits.map((limit) => (
              <span
                key={limit.label}
                data-slot="histogram-limit"
                className={cn('absolute inset-y-0 border-l border-dashed', LIMIT_BORDER[limit.tone ?? 'warning'])}
                style={{ left: position(limit.value) }}
              >
                <span
                  className={cn(
                    'absolute top-0 text-xs whitespace-nowrap text-muted-foreground',
                    (limit.value - min) / span > 0.7 ? 'right-1.5' : 'left-1.5'
                  )}
                >
                  {limit.label}
                </span>
              </span>
            ))}
          </div>
          <div className="relative mt-2 h-4 w-full text-xs text-muted-foreground tabular-nums" aria-hidden="true">
            {valueTicks.map((tick) => (
              <span key={tick} className="absolute -translate-x-1/2 leading-none" style={{ left: position(tick) }}>
                {formatValue(tick, Number.isInteger(tick) ? 0 : decimals)}
              </span>
            ))}
            {unit ? <span className="absolute right-0 top-4 leading-none">{unit}</span> : null}
          </div>
        </div>
      </div>
      {summary ? <figcaption className={cn('text-xs text-muted-foreground', unit && 'mt-2')}>{summary}</figcaption> : null}
    </figure>
  );
}
