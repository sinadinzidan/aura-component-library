import { TrendChart } from '../../industrial/charts/TrendChart';
import type { TrendLimit } from '../../industrial/charts/TrendChart';
import { formatLimit, formatReading } from '../../industrial/status';

import type { DrillNode } from './hierarchy';

export type SensorTrendProps = {
  /** A sensor node: its `series` is plotted against the limits of its `reading`. */
  node: DrillNode;
  /** What the series covers, for the accessible name: "last 24 hours". */
  period?: string;
  /** Tailwind height of the plot. */
  heightClassName?: string;
  /** Upper bound on time-axis ticks; lower it in narrow panels. */
  maxTicks?: number;
  /** No axes or tooltip: the line and its limits only. */
  compact?: boolean;
  className?: string;
};

/**
 * The trend at the bottom of every journey: one sensor's series with its operating band shaded
 * and its high and trip limits drawn and labelled. Says so in words when there is nothing to plot.
 */
export function SensorTrend({ node, period = 'last 24 hours', heightClassName = 'h-48', maxTicks = 5, compact = false, className }: SensorTrendProps) {
  const reading = node.reading;
  if (!reading || node.series.length === 0) {
    return (
      <p data-slot="sensor-trend-empty" className={`flex items-center justify-center rounded-md bg-muted-background px-3 text-sm text-muted-foreground ${heightClassName} ${className ?? ''}`.trim()}>
        No trend data for {node.tag}
      </p>
    );
  }

  const { limits, unit, decimals } = reading;
  const values = node.series.map((point) => point.v);
  const lines: TrendLimit[] = [];
  if (limits.highHigh !== undefined) lines.push({ value: limits.highHigh, label: `Trip ${formatLimit(limits.highHigh, decimals)}`, tone: 'critical' });
  if (limits.high !== undefined) lines.push({ value: limits.high, label: `High ${formatLimit(limits.high, decimals)}`, tone: 'warning' });
  if (limits.low !== undefined && limits.low > reading.rangeMin) lines.push({ value: limits.low, label: `Low ${formatLimit(limits.low, decimals)}`, tone: 'neutral' });

  const low = Math.min(...values);
  const high = Math.max(...values);
  // Show the nearest limits without flattening the line: pad the data by a third of the band.
  const band = (limits.high ?? high) - (limits.low ?? low);
  const pad = Math.max(band * 0.15, (high - low) * 0.2, 10 ** -decimals);
  const top = Math.max(high, limits.high ?? high, Math.min(limits.highHigh ?? high, high + band)) + pad;
  const bottom = Math.max(reading.rangeMin, Math.min(low, limits.low !== undefined && limits.low > reading.rangeMin ? limits.low : low) - pad);

  return (
    <TrendChart
      label={`${node.name} (${node.tag}), ${period}: between ${formatReading(low, unit, decimals)} and ${formatReading(high, unit, decimals)}`}
      series={[{ key: 'value', label: node.name, points: node.series, variant: 'area' }]}
      limits={lines}
      band={limits.low !== undefined && limits.high !== undefined ? { low: Math.max(limits.low, bottom), high: limits.high } : undefined}
      yDomain={[bottom, top]}
      unit={unit}
      decimals={decimals}
      maxTicks={maxTicks}
      compact={compact}
      showLast
      heightClassName={heightClassName}
      className={className}
    />
  );
}
