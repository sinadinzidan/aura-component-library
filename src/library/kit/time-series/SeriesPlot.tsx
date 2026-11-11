import { useId, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { useLookDefinition } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

import { areaPath, extent, fixedScale, linePath, niceScale, runs, share, tickIndexes, type Point, type Scale } from './plotMath';

export type PlotSeries = {
  id: string;
  label: string;
  /** One value per x label; `null` is a gap and breaks the line. */
  values: ReadonlyArray<number | null>;
  tone?: Tone;
  /** `step` holds each value until the next sample, for setpoints, states and counters. */
  curve?: 'look' | 'step';
  /** A reference such as a setpoint or a plan. */
  dashed?: boolean;
  /** A quieter line for context, such as the previous period. */
  ghost?: boolean;
  /** Fill under the line, the way the look fills areas. */
  fill?: boolean;
  /** Scale the series on its own axis at the right, for a second unit. */
  axis?: 'left' | 'right';
  /** Min and max per point, drawn as a band behind the line. */
  envelope?: { min: readonly number[]; max: readonly number[] };
};

export type PlotLimit = { value: number; label: string; tone?: Tone };
export type PlotBand = { from: number; to: number; tone?: Tone };
/** A stretch of time, by point index: a gap, an excursion, a selection. */
export type PlotRegion = { from: number; to: number; label?: string; tone?: Tone; pattern?: 'wash' | 'hatch' };
export type PlotEvent = { index: number; label: string; tone?: Tone };

export type SeriesPlotProps = {
  /** What the chart shows, in words. */
  label: string;
  series: readonly PlotSeries[];
  /** One label per point on the x axis, for example times. */
  labels: readonly string[];
  unit?: string;
  /** Unit of the series on the right axis. */
  rightUnit?: string;
  decimals?: number;
  rightDecimals?: number;
  /** Horizontal lines for limits, targets and setpoints, named at the end of the line. */
  limits?: readonly PlotLimit[];
  /** Shaded value ranges, for example the operating band. */
  bands?: readonly PlotBand[];
  /** Shaded stretches of time. */
  regions?: readonly PlotRegion[];
  /** Flags on the time axis: a trip, a restart, a shift change. */
  events?: readonly PlotEvent[];
  /** Number of labels on the x axis. */
  xTicks?: number;
  height?: number;
  yDomain?: readonly [number, number];
  rightDomain?: readonly [number, number];
  /** Mark the latest value of the first series with a dot and its figure. */
  highlightLast?: boolean;
  /** Follow the pointer and the arrow keys with a cursor that reads every series. */
  interactive?: boolean;
  /** A fixed cursor position, for playback and linked charts. Overrides hover. */
  cursor?: number | null;
  onCursorChange?: (index: number | null) => void;
  /** Leave out the axes for a compact plot inside a row or a small card. */
  bare?: boolean;
  /** A name in front of the unit above the axis, for rows that have no heading of their own. */
  caption?: string;
  /** Fixed widths in px for the axis gutters, so stacked plots line up. */
  gutters?: { left?: number; right?: number };
  /** Hide the time labels when a plot stacked underneath carries them. */
  hideTime?: boolean;
  className?: string;
};

const VIEW = 1000;

function tickDecimals(scale: Scale): number {
  const step = scale.ticks.length > 1 ? scale.ticks[1] - scale.ticks[0] : 1;
  if (Number.isInteger(step)) return 0;
  return step >= 0.1 ? 1 : 2;
}

function spread(positions: readonly number[], gap: number): number[] {
  const order = positions.map((position, index) => ({ position, index })).sort((a, b) => a.position - b.position);
  let previous = Number.NEGATIVE_INFINITY;
  const placed = new Array<number>(positions.length).fill(0);
  for (const entry of order) {
    const next = Math.max(entry.position, previous + gap);
    placed[entry.index] = next;
    previous = next;
  }
  return placed;
}

/**
 * A time-series plot drawn for the look it sits in: gradient areas in studio and glass, hairline
 * grids in console, ticked points on a blueprint. It handles what sensor data needs — gaps, limit
 * lines, operating bands, min–max envelopes, a second axis, flagged events and a reading cursor.
 */
export function SeriesPlot({
  label,
  series,
  labels,
  unit,
  rightUnit,
  decimals = 1,
  rightDecimals = decimals,
  limits = [],
  bands = [],
  regions = [],
  events = [],
  xTicks = 6,
  height = 240,
  yDomain,
  rightDomain,
  highlightLast = true,
  interactive = true,
  cursor,
  onCursorChange,
  bare = false,
  hideTime = false,
  caption,
  gutters,
  className,
}: SeriesPlotProps) {
  const { id: look, chart } = useLookDefinition();
  const gradientId = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  const count = labels.length;
  const active = cursor !== undefined ? cursor : hover;

  const leftSeries = series.filter((entry) => entry.axis !== 'right');
  const rightSeries = series.filter((entry) => entry.axis === 'right');
  const leftExtent = extent([
    ...leftSeries.map((entry) => entry.values),
    ...leftSeries.flatMap((entry) => (entry.envelope ? [entry.envelope.min, entry.envelope.max] : [])),
    limits.map((limit) => limit.value),
    bands.flatMap((band) => [band.from, band.to]),
  ]);
  const leftScale: Scale = yDomain ? fixedScale(yDomain[0], yDomain[1], height < 140 ? 2 : 4) : niceScale(leftExtent[0], leftExtent[1], height < 140 ? 2 : 4);
  const leftTicks = leftScale.ticks;
  const rightExtent = extent(rightSeries.map((entry) => entry.values));
  const rightScale: Scale | null =
    rightSeries.length === 0 ? null : rightDomain ? fixedScale(rightDomain[0], rightDomain[1], height < 140 ? 2 : 4) : niceScale(rightExtent[0], rightExtent[1], leftTicks.length - 1);
  const scaleOf = (entry: PlotSeries): Scale => (entry.axis === 'right' && rightScale ? rightScale : leftScale);

  const x = (index: number): number => (count <= 1 ? VIEW / 2 : (index / (count - 1)) * VIEW);
  const y = (value: number, scale: Scale): number => (1 - share(value, scale.min, scale.max)) * VIEW;
  const curveOf = (entry: PlotSeries): 'linear' | 'stepAfter' | 'monotone' => (entry.curve === 'step' ? 'stepAfter' : chart.curve);

  const leftDecimals = Math.min(decimals, tickDecimals(leftScale));
  const leftLabels = leftTicks.map((tick) => formatNumber(tick, leftDecimals));
  const leftGutter = bare ? 0 : gutters?.left ?? Math.max(32, Math.max(...leftLabels.map((text) => text.length)) * 7.5 + 12);
  const rightLabels = rightScale ? rightScale.ticks.map((tick) => formatNumber(tick, Math.min(rightDecimals, tickDecimals(rightScale)))) : [];
  const limitGutter = limits.length > 0 ? Math.max(...limits.map((limit) => limit.label.length)) * 7 + 14 : 0;
  const rightGutter = bare ? 0 : gutters?.right !== undefined ? gutters.right : rightScale ? Math.max(32, Math.max(...rightLabels.map((text) => text.length)) * 7.5 + 12) : Math.max(12, limitGutter);
  const limitTops = spread(
    limits.map((limit) => (y(limit.value, leftScale) / VIEW) * height),
    16,
  );

  const first = series[0];
  const lastIndex = first ? first.values.reduce<number>((found, value, index) => (value === null ? found : index), -1) : -1;
  const lastValue = first && lastIndex >= 0 ? first.values[lastIndex] : null;

  const moveTo = (index: number | null) => {
    if (cursor === undefined) setHover(index);
    onCursorChange?.(index);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width === 0 || count === 0) return;
    const fraction = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
    moveTo(Math.round(fraction * (count - 1)));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const from = active ?? (event.key === 'ArrowRight' ? -1 : count);
      moveTo(Math.min(count - 1, Math.max(0, from + (event.key === 'ArrowRight' ? 1 : -1))));
    }
    if (event.key === 'Escape') moveTo(null);
  };

  const activeShare = active === null || count <= 1 ? 0 : active / (count - 1);
  const glow = look === 'glass';

  return (
    <figure data-look={look} data-plot="series" className={cx('m-0 flex min-w-0 flex-col', className)}>
      {!bare && (unit || rightUnit || caption) ? (
        <div className="flex h-7 items-start justify-between text-xs leading-none text-(--kit-text-3)">
          <span>
            {caption ? <span className="font-medium text-(--kit-text-2)">{caption}</span> : null}
            {caption && unit ? ' · ' : ''}
            {unit}
          </span>
          <span>{rightUnit}</span>
        </div>
      ) : null}
      <div className="flex" style={{ height }}>
        {bare ? null : (
          <div aria-hidden="true" className="relative shrink-0 text-xs tabular-nums text-(--kit-text-2)" style={{ width: leftGutter }}>
            {leftTicks.map((tick, index) => (
              <span key={tick} className="absolute right-2 -translate-y-1/2 leading-none" style={{ top: `${(y(tick, leftScale) / VIEW) * 100}%` }}>
                {leftLabels[index]}
              </span>
            ))}
          </div>
        )}
        <div
          role="group"
          aria-label={label}
          tabIndex={interactive ? 0 : undefined}
          onPointerMove={interactive ? onPointerMove : undefined}
          onPointerLeave={interactive ? () => moveTo(null) : undefined}
          onKeyDown={interactive ? onKeyDown : undefined}
          className="relative min-w-0 flex-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-(--kit-rule-strong)"
        >
          <svg role="img" aria-label={label} viewBox={`0 0 ${VIEW} ${VIEW}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <pattern id={`${gradientId}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45) scale(1 0.3)">
                <rect width="3" height="8" fill="var(--kit-text-3)" opacity="0.5" />
              </pattern>
            </defs>
            {bands.map((band) => (
              <rect
                key={`${band.from}-${band.to}`}
                data-tone={band.tone ?? 'success'}
                data-part="band"
                x={0}
                width={VIEW}
                y={y(Math.max(band.from, band.to), leftScale)}
                height={Math.abs(y(band.from, leftScale) - y(band.to, leftScale))}
                style={{ fill: 'var(--t-line)', opacity: 0.11 }}
              />
            ))}
            {regions.map((region) => (
              <rect
                key={`${region.from}-${region.to}`}
                data-tone={region.tone ?? 'neutral'}
                data-part="region"
                x={x(region.from)}
                width={Math.max(x(region.to) - x(region.from), 2)}
                y={0}
                height={VIEW}
                style={region.pattern === 'hatch' ? { fill: `url(#${gradientId}-hatch)`, opacity: 0.5 } : { fill: 'var(--t-line)', opacity: 0.14 }}
              />
            ))}
            {bare || chart.grid === 'none'
              ? null
              : leftTicks.map((tick) => (
                  <line key={tick} x1={0} x2={VIEW} y1={y(tick, leftScale)} y2={y(tick, leftScale)} stroke="var(--kit-grid)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                ))}
            {!bare && chart.grid === 'both'
              ? tickIndexes(count, xTicks).map((index) => (
                  <line key={index} x1={x(index)} x2={x(index)} y1={0} y2={VIEW} stroke="var(--kit-grid)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                ))
              : null}
            {!bare && (chart.axisLine || chart.grid === 'none') ? (
              <path d={`M0 0V${VIEW}H${VIEW}`} fill="none" stroke="var(--kit-rule-strong)" strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={chart.axisLine ? 1 : 0.6} />
            ) : null}
            {series.map((entry, order) => {
              const scale = scaleOf(entry);
              const curve = curveOf(entry);
              const segments = runs(entry.values, (value, index): Point => ({ x: x(index), y: y(value, scale) }));
              const width = entry.ghost ? Math.max(1.25, chart.strokeWidth - 0.75) : chart.strokeWidth;
              const filled = entry.fill && chart.area !== 'none';
              const envelope = entry.envelope;
              return (
                <g key={entry.id} data-tone={entry.tone ?? 'accent'} data-series={entry.id}>
                  {filled ? (
                    <defs>
                      <linearGradient id={`${gradientId}-${order}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" style={{ stopColor: 'var(--t-line)', stopOpacity: chart.area === 'solid' ? 0.85 : 0.34 }} />
                        <stop offset="1" style={{ stopColor: 'var(--t-line)', stopOpacity: chart.area === 'solid' ? 0.85 : 0.02 }} />
                      </linearGradient>
                    </defs>
                  ) : null}
                  {envelope ? (
                    <path
                      data-part="envelope"
                      d={`${linePath(
                        envelope.max.map((value, index) => ({ x: x(index), y: y(value, scale) })),
                        'linear',
                      )}${linePath(
                        envelope.min.map((value, index) => ({ x: x(index), y: y(value, scale) })).reverse(),
                        'linear',
                      ).replace('M', 'L')}Z`}
                      style={{ fill: 'var(--t-line)', opacity: 0.2 }}
                    />
                  ) : null}
                  {filled ? segments.map((points, index) => <path key={index} data-part="area" d={areaPath(points, curve, VIEW)} fill={`url(#${gradientId}-${order})`} />) : null}
                  {segments.map((points, index) => (
                    <path
                      key={index}
                      data-part="line"
                      d={points.length === 1 ? `M${points[0].x} ${points[0].y}h0` : linePath(points, curve)}
                      fill="none"
                      strokeWidth={width}
                      strokeDasharray={entry.dashed ? '6 5' : entry.ghost ? '2 4' : undefined}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      style={{ stroke: 'var(--t-line)', opacity: entry.ghost ? 0.7 : 1, filter: glow && !entry.ghost && !entry.dashed ? 'drop-shadow(0 0 5px var(--t-line))' : undefined }}
                    />
                  ))}
                  {chart.points && !entry.ghost && !entry.dashed && count <= 60
                    ? segments.flat().map((point) => (
                        <path
                          key={point.x}
                          data-part="point"
                          d={`M${point.x} ${point.y}h0`}
                          strokeWidth={chart.strokeWidth + 3.5}
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          style={{ stroke: 'var(--t-line)' }}
                        />
                      ))
                    : null}
                </g>
              );
            })}
            {limits.map((limit) => (
              <line
                key={limit.label}
                data-tone={limit.tone ?? 'warning'}
                data-part="limit"
                x1={0}
                x2={VIEW}
                y1={y(limit.value, leftScale)}
                y2={y(limit.value, leftScale)}
                strokeWidth={1.25}
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: 'var(--t-line)' }}
              />
            ))}
            {events.map((event) => (
              <line
                key={`${event.index}-${event.label}`}
                data-tone={event.tone ?? 'neutral'}
                data-part="event"
                x1={x(event.index)}
                x2={x(event.index)}
                y1={0}
                y2={VIEW}
                strokeWidth={1.25}
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
                style={{ stroke: 'var(--t-line)' }}
              />
            ))}
          </svg>
          {regions.map((region) =>
            region.label ? (
              <span
                key={region.label}
                data-tone={region.tone ?? 'neutral'}
                className="pointer-events-none absolute bottom-1.5 -translate-x-1/2 text-xs font-medium whitespace-nowrap text-(--kit-text-2)"
                style={{ left: `${((x(region.from) + x(region.to)) / 2 / VIEW) * 100}%` }}
              >
                {region.label}
              </span>
            ) : null,
          )}
          {events.map((event) => {
            const at = count <= 1 ? 0.5 : event.index / (count - 1);
            return (
              <span
                key={`${event.index}-${event.label}`}
                data-tone={event.tone ?? 'neutral'}
                className="pointer-events-none absolute top-0 px-1.5 py-0.5 text-xs leading-tight font-medium whitespace-nowrap"
                style={{
                  left: `${at * 100}%`,
                  transform: at > 0.75 ? 'translateX(-100%)' : undefined,
                  background: 'var(--t-solid)',
                  color: 'var(--t-on-solid)',
                  borderRadius: 'min(var(--kit-radius-sm), 4px)',
                }}
              >
                {event.label}
              </span>
            );
          })}
          {highlightLast && first && lastValue !== null && lastIndex >= 0 && active === null ? (
            <>
              <span
                aria-hidden="true"
                data-tone={first.tone ?? 'accent'}
                data-part="last"
                className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${(x(lastIndex) / VIEW) * 100}%`,
                  top: `${(y(lastValue, scaleOf(first)) / VIEW) * 100}%`,
                  background: 'var(--t-line)',
                  boxShadow: '0 0 0 3px var(--kit-halo)',
                }}
              />
              {bare ? null : (
                <span
                  data-tone={first.tone ?? 'accent'}
                  className="pointer-events-none absolute px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap tabular-nums"
                  style={{
                    right: `calc(${100 - (x(lastIndex) / VIEW) * 100}% + 10px)`,
                    top: `${(y(lastValue, scaleOf(first)) / VIEW) * 100}%`,
                    transform: y(lastValue, scaleOf(first)) < VIEW * 0.2 ? 'translateY(8px)' : 'translateY(calc(-100% - 8px))',
                    background: 'var(--t-solid)',
                    color: 'var(--t-on-solid)',
                    borderRadius: 'min(var(--kit-radius-sm), 6px)',
                  }}
                >
                  {formatNumber(lastValue, first.axis === 'right' ? rightDecimals : decimals)}
                  {(first.axis === 'right' ? rightUnit : unit) ? ` ${first.axis === 'right' ? rightUnit : unit}` : ''}
                </span>
              )}
            </>
          ) : null}
          {active !== null && count > 0 ? (
            <>
              <span aria-hidden="true" data-part="cursor" className="pointer-events-none absolute inset-y-0 w-px bg-(--kit-text-2)" style={{ left: `${activeShare * 100}%` }} />
              {series.map((entry) => {
                const value = entry.values[active];
                if (value === null || value === undefined) return null;
                return (
                  <span
                    key={entry.id}
                    aria-hidden="true"
                    data-tone={entry.tone ?? 'accent'}
                    className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: `${activeShare * 100}%`, top: `${(y(value, scaleOf(entry)) / VIEW) * 100}%`, background: 'var(--t-line)', boxShadow: '0 0 0 2px var(--kit-halo)' }}
                  />
                );
              })}
              <div
                role="status"
                className="kit-chart-tip pointer-events-none absolute top-1 z-10 whitespace-nowrap"
                style={activeShare > 0.5 ? { right: `calc(${(1 - activeShare) * 100}% + 12px)` } : { left: `calc(${activeShare * 100}% + 12px)` }}
              >
                <div className="kit-chart-tip-title">{labels[active]}</div>
                {series.map((entry) => {
                  const value = entry.values[active];
                  const suffix = entry.axis === 'right' ? rightUnit : unit;
                  return (
                    <div key={entry.id} data-tone={entry.tone ?? 'accent'} className="kit-chart-tip-row">
                      <i style={{ background: 'var(--t-line)' }} />
                      {entry.label}: {value === null || value === undefined ? 'no data' : `${formatNumber(value, entry.axis === 'right' ? rightDecimals : decimals)}${suffix ? ` ${suffix}` : ''}`}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
        {bare ? null : (
          <div className="relative shrink-0 text-xs tabular-nums" style={{ width: rightGutter }}>
            {rightScale
              ? rightScale.ticks.map((tick, index) => (
                  <span key={tick} aria-hidden="true" className="absolute left-2 -translate-y-1/2 leading-none text-(--kit-text-2)" style={{ top: `${(y(tick, rightScale) / VIEW) * 100}%` }}>
                    {rightLabels[index]}
                  </span>
                ))
              : limits.map((limit, index) => (
                  <span
                    key={limit.label}
                    data-tone={limit.tone ?? 'warning'}
                    className="absolute left-2 -translate-y-1/2 leading-none font-medium whitespace-nowrap"
                    style={{ top: limitTops[index], color: 'var(--t-ink)' }}
                  >
                    {limit.label}
                  </span>
                ))}
          </div>
        )}
      </div>
      {bare || hideTime ? null : (
        <div aria-hidden="true" className="relative h-6 text-xs tabular-nums text-(--kit-text-2)" style={{ marginLeft: leftGutter, marginRight: rightGutter }}>
          {tickIndexes(count, xTicks).map((index, order, all) => (
            <span
              key={index}
              className="absolute top-2 leading-none whitespace-nowrap"
              style={{ left: `${(x(index) / VIEW) * 100}%`, transform: order === 0 ? undefined : order === all.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}
            >
              {labels[index]}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}
