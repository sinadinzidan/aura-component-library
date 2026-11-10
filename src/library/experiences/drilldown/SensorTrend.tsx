import { TrendChart } from '../../industrial/charts/TrendChart';
import { formatReading } from '../../industrial/status';

import type { DrillNode } from './hierarchy';
import { trendFrame } from './trendFrame';

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
  const low = Math.min(...values);
  const high = Math.max(...values);
  const { lines, bottom, top } = trendFrame(low, high, reading);

  return (
    <TrendChart
      label={`${node.name} (${node.tag}), ${period}: between ${formatReading(low, unit, decimals)} and ${formatReading(high, unit, decimals)}`}
      series={[{ key: 'value', label: node.name, points: node.series, variant: 'area' }]}
      limits={lines}
      band={limits.low !== undefined && limits.high !== undefined ? { low: Math.max(limits.low, bottom), high: Math.min(limits.high, top) } : undefined}
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
