import { useId } from 'react';
import type { ReactNode } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useLookDefinition } from '../looks/useLook';

import { ChartFrame } from './ChartFrame';
import type { LegendItem } from './Legend';
import { formatNumber, toneLine, type Tone } from './tones';

export type TrendSeries = {
  id: string;
  label: string;
  values: readonly number[];
  tone?: Tone;
  /** A reference series such as a plan or last week: drawn dashed and never filled. */
  dashed?: boolean;
};

export type TrendLimit = { value: number; label: string; tone?: Tone };
export type TrendBand = { from: number; to: number; tone?: Tone };

export type TrendLineProps = {
  /** What the chart shows, in words. */
  label: string;
  series: readonly TrendSeries[];
  /** One label per point on the x axis, for example times. */
  labels: readonly string[];
  unit?: string;
  decimals?: number;
  /** Horizontal lines for plans, targets and alarm limits, labelled on the plot. */
  limits?: readonly TrendLimit[];
  /** Shaded ranges, for example the normal operating band. */
  bands?: readonly TrendBand[];
  /** Fill under the first series, the way the look fills areas. */
  fill?: boolean;
  /** Mark the latest value of the first series with a dot and its figure. */
  highlightLast?: boolean;
  height?: number;
  /** Fixed y range; otherwise it fits the data and the limits. */
  yDomain?: readonly [number, number];
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
 * One or more series over time with legible axes, labelled limit lines, optional bands and the
 * current value called out. Line weight, curve, grid, point markers and fill come from the look.
 */
export function TrendLine({
  label,
  series,
  labels,
  unit = '',
  decimals = 1,
  limits = [],
  bands = [],
  fill = false,
  highlightLast = true,
  height = 240,
  yDomain,
  showLegend,
  headline,
  notes,
  className,
}: TrendLineProps) {
  const { id: look, chart } = useLookDefinition();
  const gradientId = useId().replace(/:/g, '');
  const count = Math.max(0, ...series.map((entry) => entry.values.length));
  const rows = Array.from({ length: count }, (_, index) => {
    const row: Record<string, number> = { i: index };
    for (const entry of series) {
      const value = entry.values[index];
      if (value !== undefined) row[entry.id] = value;
    }
    return row;
  });

  const lead = series[0];
  const leadColor = toneLine(lead?.tone ?? 'accent');
  const lastIndex = lead ? lead.values.length - 1 : -1;
  const lastValue = lead?.values[lastIndex];
  const all = [...series.flatMap((entry) => entry.values), ...limits.map((limit) => limit.value)];
  const widest = Math.max(...all.map((value) => formatNumber(value, decimals).length), 2);
  const step = Math.max(1, Math.ceil(count / 7));
  const ticks = Array.from({ length: count }, (_, index) => index).filter((index) => (count - 1 - index) % step === 0);
  const suffix = unit ? ` ${unit}` : '';
  const dash = look === 'blueprint' ? '10 3 2 3' : look === 'console' ? '2 3' : '5 4';
  const withLegend = showLegend ?? series.length > 1;
  const legend: LegendItem[] = [
    ...series.map((entry): LegendItem => ({ label: entry.label, tone: entry.tone ?? 'accent', mark: entry.dashed ? 'dashed' : 'line' })),
    ...limits.map((limit): LegendItem => ({ label: limit.label, tone: limit.tone ?? 'neutral', mark: 'dashed' })),
  ];
  const filled = fill && chart.area !== 'none';
  // Limit labels sit in the right margin, level with their line, so they never cross a series.
  const limitTexts = limits.map((limit) => `${limit.label} ${formatNumber(limit.value, decimals)}`);
  const rightMargin = Math.max(14, ...limitTexts.map((text) => text.length * 7 + 14));
  // The value pill goes on the side the line did not come from, so it never covers the line end.
  const before = lead ? lead.values.slice(Math.max(0, lastIndex - 3), lastIndex) : [];
  const pillBelow = lastValue !== undefined && before.length > 0 && Math.max(...before) > lastValue;

  return (
    <ChartFrame label={label} legend={withLegend ? legend : undefined} headline={headline} notes={notes} height={height} className={className}>
      {unit ? <span className="kit-chart-unit">{unit}</span> : null}
      <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL}>
        <ComposedChart data={rows} margin={{ top: 34, right: rightMargin, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={leadColor} stopOpacity={chart.area === 'solid' ? (look === 'poster' ? 1 : 0.4) : look === 'glass' ? 0.5 : 0.3} />
              <stop offset="100%" stopColor={leadColor} stopOpacity={chart.area === 'solid' ? (look === 'poster' ? 1 : 0.4) : 0.02} />
            </linearGradient>
          </defs>
          {chart.grid === 'none' ? null : (
            <CartesianGrid
              vertical={chart.grid === 'both'}
              stroke="var(--kit-grid)"
              strokeDasharray={look === 'console' ? '1 4' : undefined}
            />
          )}
          <XAxis
            dataKey="i"
            type="number"
            domain={[0, Math.max(count - 1, 1)]}
            ticks={ticks}
            tickFormatter={(index: number) => labels[index] ?? ''}
            tick={TICK}
            tickLine={false}
            tickMargin={8}
            axisLine={chart.axisLine ? { stroke: 'var(--kit-rule-strong)' } : false}
            padding={{ left: 4, right: 4 }}
          />
          <YAxis
            width={widest * 7.6 + 12}
            domain={yDomain ? [yDomain[0], yDomain[1]] : ['auto', 'auto']}
            tickCount={5}
            tickFormatter={(value: number) => formatNumber(value, decimals)}
            tick={TICK}
            tickLine={false}
            tickMargin={6}
            axisLine={chart.axisLine ? { stroke: 'var(--kit-rule-strong)' } : false}
          />
          <Tooltip
            cursor={{ stroke: 'var(--kit-rule-strong)' }}
            isAnimationActive={false}
            content={({ active, payload, label: index }) => {
              if (!active || !Array.isArray(payload)) return null;
              return (
                <div className="kit-chart-tip">
                  <div className="kit-chart-tip-title">{labels[Number(index)] ?? ''}</div>
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
          {bands.map((band) => (
            <ReferenceArea
              key={`${band.from}-${band.to}`}
              y1={band.from}
              y2={band.to}
              fill={toneLine(band.tone ?? 'success')}
              fillOpacity={0.1}
              stroke="none"
              ifOverflow="extendDomain"
            />
          ))}
          {series.map((entry, index) => {
            const color = toneLine(entry.tone ?? 'accent');
            const common = {
              dataKey: entry.id,
              type: chart.curve,
              stroke: color,
              strokeWidth: entry.dashed ? Math.max(1.5, chart.strokeWidth - 0.75) : chart.strokeWidth,
              strokeDasharray: entry.dashed ? '5 4' : undefined,
              isAnimationActive: false,
              activeDot: { r: 4, strokeWidth: 0, fill: color },
              dot: chart.points && !entry.dashed ? { r: 2.5, strokeWidth: 1.25, stroke: color, fill: 'var(--base-background)' } : false,
            } as const;
            return index === 0 && filled && !entry.dashed ? (
              <Area key={entry.id} {...common} fill={`url(#${gradientId})`} fillOpacity={1} />
            ) : (
              <Line key={entry.id} {...common} />
            );
          })}
          {limits.map((limit, limitIndex) => (
            <ReferenceLine
              key={limit.label}
              y={limit.value}
              stroke={toneLine(limit.tone ?? 'neutral')}
              strokeWidth={look === 'poster' ? 2 : 1.25}
              strokeDasharray={dash}
              ifOverflow="extendDomain"
              label={{
                value: limitTexts[limitIndex],
                position: 'right',
                fontSize: 12,
                fontWeight: 600,
                fill: toneLine(limit.tone ?? 'neutral'),
                offset: 8,
              }}
            />
          ))}
          {highlightLast && lead && lastValue !== undefined ? (
            <ReferenceDot
              x={lastIndex}
              y={lastValue}
              ifOverflow="extendDomain"
              shape={({ cx = 0, cy = 0 }: { cx?: number; cy?: number }) => {
                const text = `${formatNumber(lastValue, decimals)}${suffix}`;
                const width = text.length * 7.3 + 18;
                const top = pillBelow ? cy + 18 : Math.max(cy - 40, 0);
                const left = cx - width / 2;
                return (
                  <g>
                    <line x1={cx} y1={cy} x2={cx} y2={pillBelow ? top : top + 22} stroke={leadColor} strokeWidth={1.25} />
                    <circle cx={cx} cy={cy} r={9} fill={leadColor} opacity={0.22} />
                    <circle cx={cx} cy={cy} r={4.5} fill={leadColor} stroke="var(--base-background)" strokeWidth={2} />
                    <rect x={left} y={top} width={width} height={22} rx={Math.min(chart.barRadius, 11)} fill={leadColor} />
                    <text x={cx} y={top + 15} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--base-background)">
                      {text}
                    </text>
                  </g>
                );
              }}
            />
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
