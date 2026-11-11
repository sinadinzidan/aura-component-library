import type { ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useLookDefinition } from '../looks/useLook';

import { ChartFrame } from './ChartFrame';
import type { LegendItem } from './Legend';
import { formatNumber, niceTicks, toneLine, type Tone } from './tones';

export type BarSeries = { id: string; label: string; values: readonly number[]; tone?: Tone };

type BarsProps = {
  /** What the chart shows, in words. */
  label: string;
  categories: readonly string[];
  series: readonly BarSeries[];
  /** `horizontal` runs the bars sideways: best for ranked lists with long names. */
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
  /** Colour per category, for a single series whose bars each have a state. */
  tones?: readonly Tone[];
  unit?: string;
  decimals?: number;
  /** A target or limit drawn across the bars. */
  limit?: { value: number; label: string; tone?: Tone };
  /** Fixed range of the value axis; otherwise it runs from zero to a round number above the data. */
  yDomain?: readonly [number, number];
  /** Write each value at the end of its bar. */
  showValues?: boolean;
  height?: number;
  showLegend?: boolean;
  headline?: ReactNode;
  notes?: ReactNode;
  className?: string;
};

const TICK = { fontSize: 12, fill: 'var(--kit-text-2)' };
const INITIAL = { width: 640, height: 240 };

type TipEntry = { dataKey?: unknown; value?: unknown };

function isTipEntry(value: unknown): value is TipEntry {
  return typeof value === 'object' && value !== null;
}

/**
 * Bars for comparing categories: grouped, stacked or horizontal. Corner radius, bar width, grid
 * and axis lines follow the look — square and outlined in poster, full pills in soft.
 */
export function Bars({
  label,
  categories,
  series,
  orientation = 'vertical',
  stacked = false,
  tones,
  unit = '',
  decimals = 0,
  limit,
  yDomain,
  showValues = false,
  height = 240,
  showLegend,
  headline,
  notes,
  className,
}: BarsProps) {
  const { id: look, chart } = useLookDefinition();
  const horizontal = orientation === 'horizontal';
  const rows = categories.map((category, index) => {
    const row: Record<string, number | string> = { c: category };
    for (const entry of series) row[entry.id] = entry.values[index] ?? 0;
    return row;
  });
  // A no-break space keeps the unit on the line of its value in labels.
  const suffix = unit ? `\u00a0${unit}` : '';
  const longest = Math.max(...categories.map((category) => category.length), 2);
  const totals = categories.map((_, index) => series.reduce((sum, entry) => sum + (entry.values[index] ?? 0), 0));
  const peak = Math.max(...(stacked ? totals : series.flatMap((entry) => entry.values)), limit?.value ?? 0, 1);
  const autoTicks = niceTicks(peak, horizontal ? 2 : 4);
  const ticks = yDomain ? undefined : autoTicks;
  const top = yDomain ? yDomain[1] : (autoTicks[autoTicks.length - 1] ?? peak);
  const bottom = yDomain ? yDomain[0] : 0;
  const valueWidth = formatNumber(top, decimals).length * 7.6 + 12;
  const limitText = limit ? `${limit.label} ${formatNumber(limit.value, decimals)}${suffix}` : '';
  // The limit label sits in the right margin, level with its line, so it never crosses a bar or a value.
  const limitOutside = Boolean(limit) && !horizontal;
  const limitWidth = limitOutside ? limitText.length * 7 + 14 : 0;
  const radius = Math.min(chart.barRadius, 14);
  const legend: LegendItem[] = series.map((entry) => ({ label: entry.label, tone: entry.tone ?? 'accent' }));
  const axisLine = chart.axisLine ? { stroke: 'var(--kit-rule-strong)' } : false;
  const categoryAxis = { dataKey: 'c', type: 'category', tick: TICK, tickLine: false, axisLine, tickMargin: 8 } as const;
  const valueAxis = {
    type: 'number',
    tick: TICK,
    tickLine: false,
    axisLine: false,
    ticks,
    domain: [bottom, top],
    tickCount: 5,
    allowDataOverflow: yDomain !== undefined,
    tickFormatter: (value: number) => formatNumber(value, decimals),
  } as const;

  return (
    <ChartFrame
      label={label}
      legend={(showLegend ?? series.length > 1) ? legend : undefined}
      headline={headline}
      notes={notes}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL}>
        <BarChart
          data={rows}
          layout={horizontal ? 'vertical' : 'horizontal'}
          // Recharts applies the gap on both sides of a band, so half the unfilled share goes on each.
          barCategoryGap={`${Math.round((1 - chart.barFill) * 50)}%`}
          barGap={look === 'poster' ? 0 : 3}
          margin={{ top: limit ? 26 : showValues ? 22 : 8, right: horizontal ? (showValues ? valueWidth + 28 : 12) : 8 + limitWidth, bottom: 0, left: 0 }}
        >
          {chart.grid === 'none' ? null : (
            <CartesianGrid
              horizontal={!horizontal}
              vertical={horizontal}
              stroke="var(--kit-grid)"
              strokeDasharray={look === 'console' ? '1 4' : undefined}
            />
          )}
          {horizontal ? <XAxis {...valueAxis} /> : <XAxis {...categoryAxis} interval={0} />}
          {horizontal ? <YAxis {...categoryAxis} width={longest * 7.4 + 16} /> : <YAxis {...valueAxis} width={valueWidth} />}
          <Tooltip
            cursor={{ fill: 'var(--kit-track)' }}
            isAnimationActive={false}
            content={({ active, payload, label: category }) => {
              if (!active || !Array.isArray(payload)) return null;
              return (
                <div className="kit-chart-tip">
                  <div className="kit-chart-tip-title">{String(category ?? '')}</div>
                  {payload.filter(isTipEntry).map((entry) => {
                    const match = series.find((candidate) => candidate.id === entry.dataKey);
                    if (!match || typeof entry.value !== 'number') return null;
                    return (
                      <div key={match.id} className="kit-chart-tip-row">
                        <i style={{ background: toneLine(match.tone ?? 'accent') }} />
                        {match.label}: {formatNumber(entry.value, decimals)}
                        {suffix}
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          {series.map((entry, seriesIndex) => {
            const outer = !stacked || seriesIndex === series.length - 1;
            const corners: [number, number, number, number] = !outer
              ? [0, 0, 0, 0]
              : horizontal
                ? [0, radius, radius, 0]
                : [radius, radius, 0, 0];
            return (
              <Bar
                key={entry.id}
                dataKey={entry.id}
                stackId={stacked ? 'stack' : undefined}
                fill={toneLine(entry.tone ?? 'accent')}
                radius={corners}
                isAnimationActive={false}
              >
                {tones && series.length === 1
                  ? categories.map((category, index) => <Cell key={category} fill={toneLine(tones[index] ?? entry.tone ?? 'accent')} />)
                  : null}
                {showValues && outer ? (
                  <LabelList
                    dataKey={entry.id}
                    position={horizontal ? 'right' : 'top'}
                    offset={8}
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--kit-text)"
                    stroke="var(--kit-halo)"
                    strokeWidth={4}
                    paintOrder="stroke"
                    formatter={(value: unknown) => (typeof value === 'number' ? `${formatNumber(value, decimals)}${suffix}` : '')}
                  />
                ) : null}
              </Bar>
            );
          })}
          {limit ? (
            <ReferenceLine
              {...(horizontal ? { x: limit.value } : { y: limit.value })}
              stroke={toneLine(limit.tone ?? 'neutral')}
              strokeWidth={look === 'poster' ? 2 : 1.25}
              strokeDasharray={look === 'blueprint' ? '10 3 2 3' : '5 4'}
              label={{
                value: limitText,
                position: horizontal ? 'top' : limitOutside ? 'right' : 'insideBottomRight',
                // A halo in the surface colour keeps the label readable over bars and values.
                stroke: 'var(--kit-halo)',
                strokeWidth: 4,
                paintOrder: 'stroke',
                fontSize: 12,
                fontWeight: 600,
                fill: toneLine(limit.tone ?? 'neutral'),
                offset: 6,
              }}
            />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
