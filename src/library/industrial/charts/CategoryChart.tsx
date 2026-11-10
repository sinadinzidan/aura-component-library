import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Area, Bar, CartesianGrid, Cell, ComposedChart, LabelList, Line, ReferenceLine, XAxis, YAxis } from 'recharts';

import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

import { SeriesLegend } from './SeriesLegend';
import type { SeriesLegendItem } from './SeriesLegend';
import { axisScale, softColor } from './TrendChart';

/** One category: its name under `categoryKey` plus a number, a `[from, to]` pair or `null` per series key. */
export type CategoryRow = Record<string, string | number | null | readonly [number, number]>;

export type CategorySeries = {
  key: string;
  label: string;
  /** A chart colour token. Defaults to `chartSeriesColor(position)`. */
  color?: string;
  /** `bar` for amounts per category; `line`, `step` and `area` for targets, plans and running totals. */
  type?: 'bar' | 'line' | 'step' | 'area';
  /** Bars with the same stack id are stacked. */
  stack?: string;
  dashed?: boolean;
  axis?: 'left' | 'right';
  /** Leave the series out of the legend, e.g. a helper series. */
  hideFromLegend?: boolean;
};

export type CategoryReference = {
  value: number;
  label: string;
  tone?: 'neutral' | 'warning' | 'critical';
  axis?: 'left' | 'right';
  align?: 'left' | 'right';
  /** Put the label under the line instead of above it, when a series runs through the space above. */
  below?: boolean;
};

export type CategoryChartProps = {
  /** What the chart shows, with the key finding. Becomes the accessible name. */
  label: string;
  rows: readonly CategoryRow[];
  /** Row property that names the category. */
  categoryKey?: string;
  series: readonly CategorySeries[];
  /** `columns` puts categories along the bottom; `rows` lists them down the side for long names and rankings. */
  layout?: 'columns' | 'rows';
  /** Target, capacity or limit lines across the value axis. */
  references?: readonly CategoryReference[];
  /** Colour of one bar, to pick out single categories. Return `undefined` for the series colour. */
  colorOf?: (row: CategoryRow, seriesKey: string) => string | undefined;
  unit?: string;
  rightUnit?: string;
  decimals?: number;
  domain?: readonly [number, number];
  ticks?: readonly number[];
  rightDomain?: readonly [number, number];
  /** Print each bar's value at its end. For a single bar series. */
  valueLabels?: boolean;
  /** Hide the value axis and grid; use with `valueLabels`. */
  hideValueAxis?: boolean;
  /** Show every nth category label when there are many columns. */
  labelEvery?: number;
  /** Wrap long category names under the columns onto several lines. */
  wrapLabels?: boolean;
  legend?: boolean;
  summary?: string;
  heightClassName?: string;
  /** Pixel width of the value axis (`columns`) or of the category names (`rows`). */
  axisWidth?: number;
  barSize?: number;
  className?: string;
};

const REFERENCE_STROKE = {
  neutral: 'var(--color-chart-neutral-450)',
  warning: 'var(--color-chart-warning-450)',
  critical: 'var(--color-chart-critical-450)',
} as const;

const LABEL_CLASS = 'fill-muted-foreground';

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPair(value: unknown): value is readonly [number, number] {
  return Array.isArray(value) && value.length === 2 && isNumber(value[0]) && isNumber(value[1]);
}

/** Every number a set of series contributes to an axis, with stacked bars summed per row. */
export function categoryValues(rows: readonly CategoryRow[], series: readonly CategorySeries[]): number[] {
  const result: number[] = [];
  for (const row of rows) {
    const stacks = new Map<string, { positive: number; negative: number }>();
    for (const entry of series) {
      const value = row[entry.key];
      if (isPair(value)) result.push(value[0], value[1]);
      if (!isNumber(value)) continue;
      if ((entry.type ?? 'bar') === 'bar' && entry.stack) {
        const total = stacks.get(entry.stack) ?? { positive: 0, negative: 0 };
        if (value >= 0) total.positive += value;
        else total.negative += value;
        stacks.set(entry.stack, total);
      } else {
        result.push(value);
      }
    }
    for (const total of stacks.values()) result.push(total.positive, total.negative);
  }
  return result;
}

/**
 * Bars, lines and areas over named categories: days, shifts, areas, causes. Covers production
 * against target, stacked and grouped comparisons, floating (waterfall) bars, rankings in rows and
 * a second axis for a rate. Series take chart colours; reference lines take status colours.
 */
export function CategoryChart({
  label,
  rows,
  categoryKey = 'category',
  series,
  layout = 'columns',
  references = [],
  colorOf,
  unit,
  rightUnit,
  decimals = 0,
  domain,
  ticks,
  rightDomain,
  valueLabels = false,
  hideValueAxis = false,
  labelEvery = 1,
  wrapLabels = false,
  legend = false,
  summary,
  heightClassName = 'h-56',
  axisWidth,
  barSize,
  className,
}: CategoryChartProps) {
  const coloured = series.map((entry, index) => ({
    ...entry,
    color: entry.color ?? chartSeriesColor(index + 1),
    type: entry.type ?? 'bar',
    axis: entry.axis ?? 'left',
  }));
  const hasRight = coloured.some((entry) => entry.axis === 'right');
  const isRows = layout === 'rows';
  const hasBars = coloured.some((entry) => entry.type === 'bar');

  const onAxis = (axis: 'left' | 'right') => [
    ...categoryValues(rows, coloured.filter((entry) => entry.axis === axis)),
    ...references.filter((reference) => (reference.axis ?? 'left') === axis).map((reference) => reference.value),
    ...(hasBars && axis === 'left' ? [0] : []),
  ];
  const leftValues = onAxis('left');
  const leftScale = axisScale(leftValues, domain, ticks);
  // Bars grow from zero, so do not pad below it when nothing is negative.
  const left = !domain && hasBars && Math.min(...leftValues) >= 0 ? axisScale(leftValues, [0, leftScale.domain[1]], ticks) : leftScale;
  const right = axisScale(onAxis('right'), rightDomain);

  const config: ChartConfig = {};
  for (const entry of coloured) config[entry.key] = { label: entry.label, color: entry.color };

  const legendItems: SeriesLegendItem[] = coloured
    .filter((entry) => !entry.hideFromLegend)
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      color: entry.color,
      mark: entry.type === 'bar' ? 'bar' : entry.type === 'area' ? 'area' : entry.dashed ? 'dashed' : 'line',
    }));

  const formatAxis = (value: number) => formatValue(value, Number.isInteger(value) ? 0 : decimals);
  const formatTooltip = (value: unknown): string => {
    const amount = isPair(value) ? Math.abs(value[1] - value[0]) : value;
    if (!isNumber(amount)) return String(value);
    return unit && !hasRight ? `${formatValue(amount, decimals)} ${unit}` : formatValue(amount, decimals);
  };
  const valueAxisWidth = axisWidth ?? (isRows ? 140 : 44);

  const valueAxis = (axis: 'left' | 'right') => {
    const scale = axis === 'left' ? left : right;
    const shared = {
      type: 'number' as const,
      domain: scale.domain,
      ticks: scale.ticks,
      tickLine: false,
      axisLine: false,
      tickFormatter: formatAxis,
      hide: hideValueAxis,
    };
    if (isRows) return <XAxis key={axis} xAxisId={axis} orientation={axis === 'left' ? 'bottom' : 'top'} tickMargin={8} {...shared} />;
    return <YAxis key={axis} yAxisId={axis} orientation={axis} width={axisWidth ?? 44} {...shared} />;
  };

  return (
    <figure data-slot="category-chart" className={cn('m-0 flex w-full min-w-0 flex-col gap-2', className)}>
      {!isRows && !hideValueAxis && (unit || rightUnit) ? (
        <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
          <span>{unit}</span>
          <span>{rightUnit}</span>
        </div>
      ) : null}
      <div className={cn('w-full', heightClassName)}>
        <ChartContainer config={config} aria-label={label} className="aspect-auto h-full w-full">
          <ComposedChart
            data={[...rows]}
            layout={isRows ? 'vertical' : 'horizontal'}
            margin={{ top: valueLabels && !isRows ? 20 : 8, right: isRows ? (valueLabels ? 56 : 16) : hasRight ? 0 : 12, bottom: 0, left: 0 }}
            barGap={2}
            barCategoryGap={isRows ? '24%' : '28%'}
          >
            {hideValueAxis ? null : <CartesianGrid vertical={isRows} horizontal={!isRows} />}
            {isRows ? (
              <YAxis type="category" dataKey={categoryKey} tickLine={false} axisLine={false} width={valueAxisWidth} />
            ) : (
              <XAxis
                type="category"
                dataKey={categoryKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={labelEvery > 1 ? labelEvery - 1 : 0}
                tick={wrapLabels ? { width: 76 } : undefined}
                height={wrapLabels ? 48 : undefined}
                padding={hasBars ? undefined : { left: 20, right: 20 }}
              />
            )}
            {valueAxis('left')}
            {hasRight ? valueAxis('right') : null}
            <ChartTooltip content={<ChartTooltipContent valueFormatter={formatTooltip} />} />

            {coloured.map((entry) => {
              const axisProps = isRows ? { xAxisId: entry.axis } : { yAxisId: entry.axis };
              if (entry.type === 'bar') {
                const radius: [number, number, number, number] = isRows ? [0, 3, 3, 0] : [3, 3, 0, 0];
                return (
                  <Bar
                    key={entry.key}
                    {...axisProps}
                    dataKey={entry.key}
                    stackId={entry.stack}
                    fill={`var(--color-${entry.key})`}
                    radius={entry.stack ? undefined : radius}
                    barSize={barSize}
                    isAnimationActive={false}
                  >
                    {colorOf ? rows.map((row) => <Cell key={String(row[categoryKey])} fill={colorOf(row, entry.key) ?? `var(--color-${entry.key})`} />) : null}
                    {valueLabels ? (
                      <LabelList
                        dataKey={entry.key}
                        position={isRows ? 'right' : 'top'}
                        className="fill-base-foreground"
                        formatter={(value: unknown) => {
                          const amount = isPair(value) ? Math.abs(value[1] - value[0]) : value;
                          // The unit is repeated on the bar only when no axis header carries it.
                          return isNumber(amount) ? `${formatValue(amount, decimals)}${unit && (isRows || hideValueAxis) ? `\u00a0${unit}` : ''}` : '';
                        }}
                      />
                    ) : null}
                  </Bar>
                );
              }
              const shared = {
                ...axisProps,
                dataKey: entry.key,
                type: entry.type === 'step' ? ('stepAfter' as const) : ('monotone' as const),
                stroke: `var(--color-${entry.key})`,
                strokeWidth: 1.5,
                strokeDasharray: entry.dashed ? '4 3' : undefined,
                connectNulls: true,
                isAnimationActive: false,
              };
              return entry.type === 'area' ? (
                <Area key={entry.key} {...shared} fill={softColor(entry.color)} fillOpacity={1} />
              ) : (
                <Line key={entry.key} {...shared} dot={entry.type === 'line' && rows.length <= 14 ? { r: 2.5, fill: `var(--color-${entry.key})`, strokeWidth: 0 } : false} />
              );
            })}

            {references.map((reference) => {
              const side = reference.align === 'left' ? 'Left' : 'Right';
              const position = isRows ? 'insideTopRight' : (`inside${reference.below ? 'Top' : 'Bottom'}${side}` as const);
              const shared = {
                stroke: REFERENCE_STROKE[reference.tone ?? 'neutral'],
                strokeDasharray: '4 4',
                label: { value: reference.label, position, className: LABEL_CLASS } as const,
              };
              return isRows ? (
                <ReferenceLine key={reference.label} xAxisId={reference.axis ?? 'left'} x={reference.value} {...shared} />
              ) : (
                <ReferenceLine key={reference.label} yAxisId={reference.axis ?? 'left'} y={reference.value} {...shared} />
              );
            })}
          </ComposedChart>
        </ChartContainer>
      </div>
      {legend ? <SeriesLegend items={legendItems} /> : null}
      {summary ? <figcaption className="text-xs text-muted-foreground">{summary}</figcaption> : null}
    </figure>
  );
}
