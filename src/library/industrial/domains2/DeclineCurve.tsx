import { TrendChart } from '../charts/TrendChart';
import type { TrendPoint } from '../charts/trendData';
import { formatValue } from '../status';

export type DeclineCurveProps = {
  /** What declines, with the key finding. Becomes the accessible name. */
  label: string;
  /** Measured rates, oldest first. */
  history: readonly TrendPoint[];
  /** Forecast rates, e.g. from `declineSeries`. Start it at the last history point so the lines meet. */
  forecast: readonly TrendPoint[];
  /** Rate below which the well no longer pays for itself. */
  economicLimit?: number;
  unit?: string;
  decimals?: number;
  historyLabel?: string;
  forecastLabel?: string;
  yDomain?: readonly [number, number];
  summary?: string;
  heightClassName?: string;
  className?: string;
};

/**
 * A production decline curve: measured rate as a solid line, the fitted forecast as a dashed
 * continuation, a marker where the forecast starts and the economic limit as a reference line.
 * Fit the forecast with `declineSeries`; this component only draws it.
 */
export function DeclineCurve({
  label,
  history,
  forecast,
  economicLimit,
  unit,
  decimals = 0,
  historyLabel = 'Measured',
  forecastLabel = 'Forecast',
  yDomain,
  summary,
  heightClassName = 'h-64',
  className,
}: DeclineCurveProps) {
  const forecastStart = forecast[0]?.t;
  const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });

  return (
    <TrendChart
      label={label}
      series={[
        { key: 'history', label: historyLabel, points: history },
        { key: 'forecast', label: forecastLabel, points: forecast, dashed: true, color: 'var(--color-chart-1-300)' },
      ]}
      limits={economicLimit === undefined ? [] : [{ value: economicLimit, label: `Economic limit ${formatValue(economicLimit, decimals)}`, tone: 'neutral', align: 'left' }]}
      events={forecastStart === undefined ? [] : [{ t: forecastStart, label: 'Forecast starts', solid: true }]}
      unit={unit}
      decimals={decimals}
      yDomain={yDomain}
      formatTick={(timestamp) => monthYear.format(timestamp)}
      maxTicks={6}
      legend
      summary={summary}
      heightClassName={heightClassName}
      className={className}
    />
  );
}
