import { chartSeriesColor } from '@cognite/aura/chart';

import { TrendChart } from '../charts/TrendChart';
import type { TrendEvent, TrendLimit, TrendMarker, TrendRegion, TrendSeries } from '../charts/TrendChart';

import { knownPoints } from './forecast';
import type { ForecastPoint, ForecastRange, ForecastSample } from './forecast';

export type ForecastScenario = {
  key: string;
  label: string;
  /** Future points only; the chart joins them to the last measured value. */
  points: readonly ForecastPoint[];
  /** A chart colour token. Defaults to the next chart colour. */
  color?: string;
};

export type ForecastChartProps = {
  /** What the chart shows, with the key finding. Becomes the accessible name. */
  label: string;
  /** Measured values up to `now`, oldest first. */
  history: readonly ForecastSample[];
  /** Predicted values after `now`. Leave out when `scenarios` are given instead. */
  forecast?: readonly ForecastPoint[];
  /** Range around the forecast, e.g. P10–P90. */
  band?: readonly ForecastRange[];
  /** Where measurement ends and prediction starts. Drawn as a solid line labelled "Now". */
  now: number;
  /** Measured values after the forecast start, for a backtest. Drawn solid over the forecast. */
  actual?: readonly ForecastSample[];
  /** Several futures from the same starting point, instead of one forecast. */
  scenarios?: readonly ForecastScenario[];
  /** Greys the forecast and its band: the model is not confident enough to act on. */
  lowConfidence?: boolean;
  historyLabel?: string;
  forecastLabel?: string;
  bandLabel?: string;
  actualLabel?: string;
  /** Text on the boundary line. */
  nowLabel?: string;
  limits?: readonly TrendLimit[];
  markers?: readonly TrendMarker[];
  regions?: readonly TrendRegion[];
  /** Extra time markers, in addition to the "now" boundary. */
  events?: readonly TrendEvent[];
  unit?: string;
  decimals?: number;
  yDomain?: readonly [number, number];
  yTicks?: readonly number[];
  maxTicks?: number;
  legend?: boolean;
  summary?: string;
  heightClassName?: string;
  className?: string;
};

const NEUTRAL = 'var(--color-chart-neutral-450)';

/**
 * A measured series and its forecast on one time axis. The boundary between the two is always
 * marked, the forecast is always dashed, and the uncertainty is a band that widens with the
 * horizon — so a prediction is never mistaken for a measurement.
 */
export function ForecastChart({
  label,
  history,
  forecast = [],
  band = [],
  now,
  actual,
  scenarios = [],
  lowConfidence = false,
  historyLabel = 'Measured',
  forecastLabel = 'Forecast',
  bandLabel = 'P10–P90 range',
  actualLabel = 'Actual',
  nowLabel = 'Now',
  limits,
  markers,
  regions,
  events = [],
  unit,
  decimals,
  yDomain,
  yTicks,
  maxTicks,
  legend = true,
  summary,
  heightClassName,
  className,
}: ForecastChartProps) {
  const measured = knownPoints(history);
  const anchor = measured[measured.length - 1];
  // Forecast lines start on the last measured value so the two lines meet at the boundary.
  const joined = (points: readonly ForecastPoint[]): ForecastPoint[] => (anchor ? [anchor, ...points] : [...points]);
  const forecastColor = lowConfidence ? NEUTRAL : chartSeriesColor(1);

  const series: TrendSeries[] = [
    { key: 'history', label: historyLabel, points: history, color: chartSeriesColor(1) },
    ...(forecast.length > 0 ? [{ key: 'forecast', label: forecastLabel, points: joined(forecast), dashed: true, color: forecastColor }] : []),
    ...scenarios.map((scenario, index) => ({
      key: scenario.key,
      label: scenario.label,
      points: joined(scenario.points),
      dashed: true,
      color: scenario.color ?? chartSeriesColor(index + 2),
    })),
    ...(actual ? [{ key: 'actual', label: actualLabel, points: actual, color: chartSeriesColor(2) }] : []),
  ];

  const envelope =
    band.length > 0
      ? [
          {
            key: 'band',
            label: bandLabel,
            points: anchor ? [{ t: anchor.t, low: anchor.v, high: anchor.v }, ...band] : [...band],
            color: lowConfidence ? 'var(--color-chart-neutral-100)' : 'var(--color-chart-1-100)',
          },
        ]
      : [];

  return (
    <TrendChart
      label={label}
      series={series}
      envelopes={envelope}
      events={[{ t: now, label: nowLabel, solid: true }, ...events]}
      limits={limits}
      markers={markers}
      regions={regions}
      unit={unit}
      decimals={decimals}
      yDomain={yDomain}
      yTicks={yTicks}
      maxTicks={maxTicks}
      legend={legend}
      summary={summary}
      heightClassName={heightClassName}
      className={className}
    />
  );
}
