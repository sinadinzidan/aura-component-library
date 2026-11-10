import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine, XAxis, YAxis } from 'recharts';

import { cn } from '../../../lib/utils';
import { TONE_ZONE_BG, formatValue } from '../status';
import type { Tone } from '../status';

import { SeriesLegend } from './SeriesLegend';
import type { SeriesLegendItem } from './SeriesLegend';
import { niceTicks } from './stats';
import { formatClock, formatDayTime, tickFormatter, timeStep, timeTicks } from './timeAxis';
import { extent, mergeSeries, splitAtThreshold, timeFraction, valueAt } from './trendData';
import type { RangePoint, TrendPoint } from './trendData';

export type TrendAxis = 'left' | 'right';

export type TrendSeries = {
  key: string;
  label: string;
  /** Oldest first. A `null` value is a gap. */
  points: readonly TrendPoint[];
  /** A chart colour token. Defaults to `chartSeriesColor(position)`. */
  color?: string;
  /** `step` holds each value until the next sample: setpoints, states, valve commands. */
  variant?: 'line' | 'area' | 'step';
  dashed?: boolean;
  /** Draws the series in quiet grey behind the others: a previous period or a baseline. */
  ghost?: boolean;
  axis?: TrendAxis;
  /** Bridge gaps. Use for a series sampled less often than the others on the chart. */
  connectNulls?: boolean;
  hidden?: boolean;
};

export type TrendLimit = {
  value: number;
  /** Printed on the line: "High 52". */
  label: string;
  tone?: 'warning' | 'critical' | 'neutral';
  axis?: TrendAxis;
  /** Which end of the line carries the label. */
  align?: 'left' | 'right';
};

export type TrendBand = { low: number; high: number; label?: string; axis?: TrendAxis };

export type TrendEnvelope = {
  key: string;
  label: string;
  /** Low and high value per timestamp, e.g. min/max per hour or two quantiles. */
  points: readonly RangePoint[];
  /** A light chart token, e.g. `var(--color-chart-1-200)`. */
  color?: string;
  axis?: TrendAxis;
};

export type TrendRegionTone = 'neutral' | 'warning' | 'critical' | 'info' | 'selection';
export type TrendRegion = { from: number; to: number; label?: string; tone?: TrendRegionTone };

export type TrendEvent = {
  t: number;
  /** Short text above the plot: "Alarm", "WO started", "1". */
  label?: string;
  tone?: Tone;
  /** Solid line instead of dashed, for boundaries such as "now" or the start of a forecast. */
  solid?: boolean;
};

export type TrendMarker = {
  t: number;
  v: number;
  label?: string;
  tone?: Tone;
  axis?: TrendAxis;
  /** Side of the dot the label sits on; pick the side the series leaves free. */
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
};

/** A stretch of a discrete state, drawn as a strip under the plot on the same time axis. */
export type TrendState = { from: number; to: number; label: string; tone: Tone };

export type TrendChartProps = {
  /** What the chart shows, with the key finding. Becomes the accessible name. */
  label: string;
  series: readonly TrendSeries[];
  limits?: readonly TrendLimit[];
  /** Shaded normal operating band. */
  band?: TrendBand;
  envelopes?: readonly TrendEnvelope[];
  /** Shaded time ranges: maintenance windows, shutdowns, bad-quality periods, a selection. */
  regions?: readonly TrendRegion[];
  /** Vertical markers at points in time. */
  events?: readonly TrendEvent[];
  /** Dots on a value at a time, with an optional note. */
  markers?: readonly TrendMarker[];
  states?: readonly TrendState[];
  /** Accessible name of the state strip, e.g. "Compressor run state". */
  statesLabel?: string;
  /** Vertical cursor with a dot on every series, for a pinned readout. */
  cursor?: number;
  /** Recolours the part of one series that is above a value. */
  highlight?: { seriesKey: string; above: number; tone?: 'warning' | 'critical' };
  /** Time window. Defaults to the extent of the data. */
  xDomain?: readonly [number, number];
  yDomain?: readonly [number, number];
  yTicks?: readonly number[];
  rightDomain?: readonly [number, number];
  /** Unit of the left axis: printed above the axis and in the tooltip. */
  unit?: string;
  rightUnit?: string;
  decimals?: number;
  /** Upper bound on x-axis ticks; lower it for narrow charts. */
  maxTicks?: number;
  /** Tick label override, e.g. relative time. Receives the timestamp. */
  formatTick?: (timestamp: number) => string;
  timeZone?: string;
  /** No axes, grid or tooltip: the plot alone, for a card or a table row. */
  compact?: boolean;
  /** Hide the time axis labels when a chart below shares the axis. */
  hideXAxis?: boolean;
  /** Dot on the latest value of each series. */
  showLast?: boolean;
  legend?: boolean;
  /** One line under the chart saying what it shows, for everyone who cannot read the plot. */
  summary?: string;
  /** Tailwind height of the plot, e.g. `h-56`. */
  heightClassName?: string;
  /** Pixel width reserved for each y axis. Charts stacked on one time axis must share it. */
  axisWidth?: number;
  className?: string;
};

const STROKE: Record<Tone, string> = {
  neutral: 'var(--color-chart-neutral-450)',
  success: 'var(--color-chart-success-450)',
  warning: 'var(--color-chart-warning-450)',
  critical: 'var(--color-chart-critical-450)',
  info: 'var(--color-chart-info-450)',
};

const REGION_FILL: Record<TrendRegionTone, string> = {
  neutral: 'var(--color-chart-neutral-100)',
  warning: 'var(--color-chart-warning-100)',
  critical: 'var(--color-chart-critical-100)',
  info: 'var(--color-chart-info-100)',
  selection: 'var(--color-chart-1-100)',
};

const GHOST = 'var(--color-chart-neutral-300)';
const LABEL_CLASS = 'fill-muted-foreground';
const MARGIN_RIGHT = 12;

/** The lighter step of a `chart-*-450` token; other colours are returned unchanged. */
export function softColor(color: string, step: 100 | 200 = 100): string {
  return color.replace(/-450\)$/, `-${step})`);
}

/**
 * Where an event label goes: centred above its line, or tucked inside the plot beside the line
 * when the event is so close to an edge that a centred label would be cut off.
 */
export function eventLabelPosition(label: string, percent: number): 'top' | 'insideTopLeft' | 'insideTopRight' {
  const reach = Math.min(30, label.length * 1.2);
  if (percent > 100 - reach) return 'insideTopRight';
  if (percent < reach) return 'insideTopLeft';
  return 'top';
}

type AxisScale = { domain: [number, number]; ticks: number[] };

/** A padded, round y scale for the given values, or the explicit domain when one is set. */
export function axisScale(
  values: readonly (number | null | undefined)[],
  explicit?: readonly [number, number],
  explicitTicks?: readonly number[]
): AxisScale {
  if (explicit) {
    const ticks = explicitTicks ?? niceTicks(explicit[0], explicit[1]).filter((tick) => tick >= explicit[0] && tick <= explicit[1]);
    return { domain: [explicit[0], explicit[1]], ticks: [...ticks] };
  }
  const range = extent(values) ?? [0, 1];
  const padding = (range[1] - range[0]) * 0.08 || Math.abs(range[1]) * 0.05 || 1;
  const ticks = niceTicks(range[0] - padding, range[1] + padding);
  return { domain: [ticks[0], ticks[ticks.length - 1]], ticks };
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function lastPoint(points: readonly TrendPoint[]): { t: number; v: number } | undefined {
  for (let index = points.length - 1; index >= 0; index -= 1) {
    const point = points[index];
    if (point.v !== null) return { t: point.t, v: point.v };
  }
  return undefined;
}

/**
 * The time-series chart of the industrial pages: one or more sensor series on a shared time axis
 * with everything an operator reads a trend against — limits, operating band, min/max envelope,
 * shaded periods, event markers, a cursor and a state strip. Colours come from chart tokens only;
 * limits and abnormal regions are the only places status colour appears.
 */
export function TrendChart({
  label,
  series,
  limits = [],
  band,
  envelopes = [],
  regions = [],
  events = [],
  markers = [],
  states,
  statesLabel = 'State',
  cursor,
  highlight,
  xDomain,
  yDomain,
  yTicks,
  rightDomain,
  unit,
  rightUnit,
  decimals = 1,
  maxTicks = 6,
  formatTick,
  timeZone = 'UTC',
  compact = false,
  hideXAxis = false,
  showLast = false,
  legend = false,
  summary,
  heightClassName = 'h-56',
  axisWidth = 44,
  className,
}: TrendChartProps) {
  const coloured = series.map((entry, index) => ({
    ...entry,
    color: entry.ghost ? GHOST : (entry.color ?? chartSeriesColor(index + 1)),
    axis: entry.axis ?? 'left',
  }));
  const visible = coloured.filter((entry) => !entry.hidden);

  // The highlighted part is drawn as an extra series on top of its source.
  const drawn = visible.flatMap((entry) => {
    if (!highlight || highlight.seriesKey !== entry.key) return [entry];
    const { base, over } = splitAtThreshold(entry.points, highlight.above);
    return [
      { ...entry, points: base },
      { ...entry, key: `${entry.key}-over`, label: `${entry.label}, above limit`, points: over, color: STROKE[highlight.tone ?? 'warning'], variant: entry.variant === 'area' ? 'line' : entry.variant } as const,
    ];
  });

  const rows = mergeSeries(
    drawn.map((entry) => ({ key: entry.key, points: entry.points })),
    envelopes.map((entry) => ({ key: entry.key, points: entry.points }))
  );
  const timeExtent = extent(rows.map((row) => row.t)) ?? [0, 1];
  const from = xDomain ? xDomain[0] : timeExtent[0];
  const to = xDomain ? xDomain[1] : timeExtent[1];
  const step = timeStep(from, to, maxTicks);
  const hasRight = visible.some((entry) => entry.axis === 'right');

  const valuesOn = (axis: TrendAxis): (number | null)[] => [
    ...visible.filter((entry) => entry.axis === axis).flatMap((entry) => entry.points.map((point) => point.v)),
    ...envelopes.filter((entry) => (entry.axis ?? 'left') === axis).flatMap((entry) => entry.points.flatMap((point) => [point.low, point.high])),
    ...limits.filter((limit) => (limit.axis ?? 'left') === axis).map((limit) => limit.value),
    ...(band && (band.axis ?? 'left') === axis ? [band.low, band.high] : []),
    ...markers.filter((marker) => (marker.axis ?? 'left') === axis).map((marker) => marker.v),
  ];
  const left = axisScale(valuesOn('left'), yDomain, yTicks);
  const right = axisScale(valuesOn('right'), rightDomain);

  const config: ChartConfig = {};
  for (const entry of drawn) config[entry.key] = { label: entry.label, color: entry.color };
  for (const entry of envelopes) config[entry.key] = { label: entry.label, color: entry.color ?? 'var(--color-chart-1-100)' };

  const legendItems: SeriesLegendItem[] = [
    ...coloured.map((entry) => ({
      key: entry.key,
      label: entry.label,
      color: entry.color,
      mark: entry.dashed ? ('dashed' as const) : entry.variant === 'area' ? ('area' as const) : ('line' as const),
    })),
    ...envelopes.map((entry) => ({ key: entry.key, label: entry.label, color: entry.color ?? 'var(--color-chart-1-100)', mark: 'area' as const })),
  ];

  const sameUnit = !hasRight && unit !== undefined;
  const formatTooltipValue = (value: unknown): string => {
    if (Array.isArray(value)) return value.map((part) => (isNumber(part) ? formatValue(part, decimals) : String(part))).join(' – ');
    if (!isNumber(value)) return String(value);
    return sameUnit ? `${formatValue(value, decimals)} ${unit}` : formatValue(value, decimals);
  };
  const hasEventLabels = events.some((event) => event.label);
  const paddingLeft = compact ? 0 : axisWidth;
  const paddingRight = compact ? 0 : hasRight ? axisWidth : MARGIN_RIGHT;
  const uniqueStates = states ? states.filter((state, index) => states.findIndex((other) => other.label === state.label) === index) : [];

  return (
    <figure data-slot="trend-chart" className={cn('m-0 flex w-full min-w-0 flex-col gap-2', className)}>
      {!compact && (unit || rightUnit) ? (
        <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
          <span>{unit}</span>
          <span>{rightUnit}</span>
        </div>
      ) : null}
      <div className={cn('w-full', heightClassName)}>
        <ChartContainer config={config} aria-label={label} className="aspect-auto h-full w-full">
          <ComposedChart
            data={rows}
            margin={
              compact
                ? { top: 4, right: 4, bottom: 4, left: 4 }
                : { top: hasEventLabels ? 20 : 8, right: hasRight ? 0 : MARGIN_RIGHT, bottom: 0, left: 0 }
            }
          >
            {compact ? null : <CartesianGrid vertical={false} />}
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={[from, to]}
              ticks={timeTicks(from, to, maxTicks)}
              tickFormatter={formatTick ?? tickFormatter(step, timeZone)}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              hide={compact || hideXAxis}
              allowDataOverflow
            />
            <YAxis
              yAxisId="left"
              domain={left.domain}
              ticks={left.ticks}
              tickLine={false}
              axisLine={false}
              width={axisWidth}
              tickFormatter={(value: number) => formatValue(value, Number.isInteger(value) ? 0 : decimals)}
              hide={compact}
              allowDataOverflow
            />
            {hasRight ? (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={right.domain}
                ticks={right.ticks}
                tickLine={false}
                axisLine={false}
                width={axisWidth}
                tickFormatter={(value: number) => formatValue(value, Number.isInteger(value) ? 0 : decimals)}
                hide={compact}
                allowDataOverflow
              />
            ) : null}
            {compact ? null : (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="line"
                    valueFormatter={formatTooltipValue}
                    labelFormatter={(_, payload) => {
                      const t = payload[0]?.payload?.t;
                      return isNumber(t) ? formatDayTime(t, timeZone) : null;
                    }}
                  />
                }
              />
            )}

            {band ? (
              <ReferenceArea
                yAxisId={band.axis ?? 'left'}
                y1={band.low}
                y2={band.high}
                fill="var(--color-chart-neutral-100)"
                fillOpacity={1}
                stroke="none"
                label={band.label && !compact ? { value: band.label, position: 'insideBottomLeft', className: LABEL_CLASS } : undefined}
              />
            ) : null}
            {regions.map((region) => (
              <ReferenceArea
                key={`region-${region.from}-${region.to}`}
                yAxisId="left"
                x1={Math.max(region.from, from)}
                x2={Math.min(region.to, to)}
                fill={REGION_FILL[region.tone ?? 'neutral']}
                fillOpacity={1}
                stroke={region.tone === 'selection' ? 'var(--color-chart-1-300)' : 'none'}
                label={region.label && !compact ? { value: region.label, position: 'insideTop', className: LABEL_CLASS } : undefined}
              />
            ))}

            {envelopes.map((entry) => (
              <Area
                key={entry.key}
                yAxisId={entry.axis ?? 'left'}
                dataKey={entry.key}
                type="monotone"
                stroke="none"
                fill={`var(--color-${entry.key})`}
                fillOpacity={1}
                connectNulls
                activeDot={false}
                isAnimationActive={false}
              />
            ))}
            {drawn.map((entry) => {
              const shared = {
                yAxisId: entry.axis,
                dataKey: entry.key,
                type: entry.variant === 'step' ? ('stepAfter' as const) : ('monotone' as const),
                stroke: `var(--color-${entry.key})`,
                strokeWidth: 1.5,
                strokeDasharray: entry.dashed ? '4 3' : undefined,
                connectNulls: entry.connectNulls ?? false,
                isAnimationActive: false,
              };
              return entry.variant === 'area' ? (
                <Area key={entry.key} {...shared} fill={softColor(entry.color)} fillOpacity={1} />
              ) : (
                <Line key={entry.key} {...shared} dot={false} />
              );
            })}

            {limits.map((limit) => (
              <ReferenceLine
                key={`limit-${limit.label}`}
                yAxisId={limit.axis ?? 'left'}
                y={limit.value}
                stroke={STROKE[limit.tone ?? 'warning']}
                strokeDasharray="4 4"
                label={
                  compact
                    ? undefined
                    : { value: limit.label, position: limit.align === 'left' ? 'insideBottomLeft' : 'insideBottomRight', className: LABEL_CLASS }
                }
              />
            ))}
            {events.map((event) => (
              <ReferenceLine
                key={`event-${event.t}-${event.label ?? ''}`}
                yAxisId="left"
                x={event.t}
                stroke={STROKE[event.tone ?? 'neutral']}
                strokeDasharray={event.solid ? undefined : '2 3'}
                label={event.label && !compact ? { value: event.label, position: eventLabelPosition(event.label, timeFraction(event.t, from, to)), className: LABEL_CLASS } : undefined}
              />
            ))}
            {cursor !== undefined ? <ReferenceLine yAxisId="left" x={cursor} stroke="var(--color-chart-neutral-450)" /> : null}
            {cursor !== undefined
              ? visible.map((entry) => {
                  const value = valueAt(entry.points, cursor);
                  return value === null ? null : (
                    <ReferenceDot key={`cursor-${entry.key}`} yAxisId={entry.axis} x={cursor} y={value} r={3.5} fill={entry.color} stroke="var(--color-base-background)" strokeWidth={1.5} />
                  );
                })
              : null}
            {showLast
              ? visible.map((entry) => {
                  const last = lastPoint(entry.points);
                  return last ? <ReferenceDot key={`last-${entry.key}`} yAxisId={entry.axis} x={last.t} y={last.v} r={3} fill={entry.color} stroke="none" /> : null;
                })
              : null}
            {markers.map((marker) => (
              <ReferenceDot
                key={`marker-${marker.t}-${marker.v}`}
                yAxisId={marker.axis ?? 'left'}
                x={marker.t}
                y={marker.v}
                r={4}
                fill={STROKE[marker.tone ?? 'neutral']}
                stroke="var(--color-base-background)"
                strokeWidth={1.5}
                label={marker.label && !compact ? { value: marker.label, position: marker.labelPosition ?? 'top', offset: 8, className: 'fill-base-foreground' } : undefined}
              />
            ))}
          </ComposedChart>
        </ChartContainer>
      </div>

      {states && states.length > 0 ? (
        <div data-slot="trend-states" className="flex flex-col gap-2" style={{ paddingLeft, paddingRight }}>
          <div
            role="img"
            aria-label={`${statesLabel}: ${states.map((state) => `${state.label} from ${formatClock(state.from, timeZone)} to ${formatClock(state.to, timeZone)}`).join(', ')}`}
            className="relative h-2.5 w-full overflow-hidden rounded-sm bg-muted-background"
          >
            {states.map((state) => {
              const start = timeFraction(state.from, from, to);
              const end = timeFraction(state.to, from, to);
              return (
                <span
                  key={`${state.from}-${state.label}`}
                  data-slot="trend-state"
                  data-tone={state.tone}
                  title={`${state.label}, ${formatClock(state.from, timeZone)}–${formatClock(state.to, timeZone)}`}
                  className={cn('absolute inset-y-0', TONE_ZONE_BG[state.tone])}
                  style={{ left: `${start}%`, width: `${Math.max(end - start, 0)}%` }}
                />
              );
            })}
          </div>
          <ul aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-medium-foreground">
            {uniqueStates.map((state) => (
              <li key={state.label} className="flex items-center gap-1.5">
                <span className={cn('size-2 rounded-xs', TONE_ZONE_BG[state.tone])} />
                {state.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {legend ? <SeriesLegend items={legendItems} hiddenKeys={coloured.filter((entry) => entry.hidden).map((entry) => entry.key)} /> : null}
      {summary ? <figcaption className="text-xs text-muted-foreground">{summary}</figcaption> : null}
    </figure>
  );
}
