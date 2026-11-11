import type { ReactNode } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { useLookDefinition } from '../../looks/useLook';
import { ChartFrame } from '../ChartFrame';
import type { LegendItem } from '../Legend';
import { formatNumber, toneLine, type Tone } from '../tones';

import type { ForecastRange } from './forecast';

export type ForecastScenario = { id: string; label: string; values: readonly number[]; tone: Tone };

type ForecastChartProps = {
  /** What the chart shows, in words. */
  label: string;
  /** One label per point across history and forecast together. */
  labels: readonly string[];
  /** Measured values up to now. */
  history: readonly number[];
  /** Predicted values after the last measured one. */
  forecast: readonly number[];
  /** The range the forecast is expected to stay in, one entry per forecast point. */
  range?: readonly ForecastRange[];
  /** What the range means, for the legend: "80 % range". */
  rangeLabel?: string;
  /** What was measured over the forecast period, for a backtest. */
  actual?: readonly number[];
  /** Alternative forecasts that fan out from now. */
  scenarios?: readonly ForecastScenario[];
  /** A limit or plan the forecast is read against. */
  limit?: { value: number; label: string; tone?: Tone };
  /** Where the forecast meets the limit: steps after now, with the words to print there. */
  crossing?: { steps: number; label: string };
  /** Label every nth point on the time axis, counted from now. Leave out for about eight labels. */
  tickEvery?: number;
  historyLabel?: string;
  forecastLabel?: string;
  unit?: string;
  decimals?: number;
  tone?: Tone;
  height?: number;
  yDomain?: readonly [number, number];
  showLegend?: boolean;
  headline?: ReactNode;
  notes?: ReactNode;
  className?: string;
};

type TipEntry = { dataKey?: unknown; value?: unknown };

function isTipEntry(value: unknown): value is TipEntry {
  return typeof value === 'object' && value !== null;
}

const TICK = { fontSize: 12, fill: 'var(--kit-text-2)' };
const INITIAL = { width: 640, height: 260 };

/**
 * History that turns into a forecast at "now": the measured line is solid, the prediction dashed,
 * and the expected range widens behind it. A limit, the point where the forecast meets it,
 * scenarios and a backtest can be laid on top. Line weight, curve, grid and the way the range is
 * drawn come from the look.
 */
export function ForecastChart({
  label,
  labels,
  history,
  forecast,
  range,
  rangeLabel = 'Expected range',
  actual,
  scenarios = [],
  limit,
  crossing,
  tickEvery,
  historyLabel = 'Measured',
  forecastLabel = 'Forecast',
  unit = '',
  decimals = 1,
  tone = 'accent',
  height = 260,
  yDomain,
  showLegend = true,
  headline,
  notes,
  className,
}: ForecastChartProps) {
  const { id: look, chart } = useLookDefinition();
  const now = history.length - 1;
  const count = history.length + forecast.length;
  const last = history[now];
  const rows = Array.from({ length: count }, (_, index) => {
    const row: Record<string, number | [number, number]> = { i: index };
    if (index <= now) row.history = history[index];
    if (index === now && last !== undefined) {
      row.forecast = last;
      if (range) row.range = [last, last];
      if (actual) row.actual = last;
      for (const scenario of scenarios) row[scenario.id] = last;
    }
    if (index > now) {
      const step = index - now - 1;
      row.forecast = forecast[step];
      const span = range?.[step];
      if (span) row.range = [span.low, span.high];
      const seen = actual?.[step];
      if (seen !== undefined) row.actual = seen;
      for (const scenario of scenarios) {
        const value = scenario.values[step];
        if (value !== undefined) row[scenario.id] = value;
      }
    }
    return row;
  });

  const color = toneLine(tone);
  const outline = chart.area === 'none';
  const all = [...history, ...forecast, ...(range ?? []).flatMap((span) => [span.low, span.high]), ...(limit ? [limit.value] : [])];
  const widest = Math.max(...all.map((value) => formatNumber(value, decimals).length), 2);
  const step = tickEvery ?? Math.max(1, Math.ceil(count / 8));
  const ticks = Array.from({ length: count }, (_, index) => index).filter((index) => (index - now) % step === 0);
  const suffix = unit ? ` ${unit}` : '';
  const limitText = limit ? `${limit.label} ${formatNumber(limit.value, decimals)}` : '';
  const rightMargin = Math.max(16, limitText.length * 7 + 14);
  const names: Record<string, { label: string; color: string }> = {
    history: { label: historyLabel, color },
    forecast: { label: forecastLabel, color },
    actual: { label: 'Actual', color: 'var(--kit-text)' },
  };
  for (const scenario of scenarios) names[scenario.id] = { label: scenario.label, color: toneLine(scenario.tone) };
  const legend: LegendItem[] = [
    { label: historyLabel, tone, mark: 'line' },
    { label: forecastLabel, tone, mark: 'dashed' },
    ...(range ? [{ label: rangeLabel, tone, mark: 'swatch' } satisfies LegendItem] : []),
    ...(actual ? [{ label: 'Actual', tone: 'neutral', mark: 'line' } satisfies LegendItem] : []),
    ...scenarios.map((scenario): LegendItem => ({ label: scenario.label, tone: scenario.tone, mark: 'dashed' })),
    ...(limit ? [{ label: limit.label, tone: limit.tone ?? 'critical', mark: 'dashed' } satisfies LegendItem] : []),
  ];

  return (
    <ChartFrame label={label} legend={showLegend ? legend : undefined} headline={headline} notes={notes} height={height} className={className}>
      {unit ? <span className="kit-chart-unit">{unit}</span> : null}
      <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL}>
        <ComposedChart data={rows} margin={{ top: 34, right: rightMargin, bottom: 0, left: 0 }}>
          {chart.grid === 'none' ? null : <CartesianGrid vertical={chart.grid === 'both'} stroke="var(--kit-grid)" strokeDasharray={look === 'console' ? '1 4' : undefined} />}
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
                    const name = typeof entry.dataKey === 'string' ? names[entry.dataKey] : undefined;
                    if (!name || typeof entry.value !== 'number') return null;
                    return (
                      <div key={name.label} className="kit-chart-tip-row">
                        <i style={{ background: name.color }} />
                        {name.label}: {formatNumber(entry.value, decimals)}
                        {suffix}
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          <ReferenceArea x1={now} x2={count - 1} fill="var(--kit-text)" fillOpacity={look === 'poster' ? 0 : 0.035} stroke="none" />
          {range ? (
            <Area
              dataKey="range"
              type={chart.curve}
              stroke={outline ? color : 'none'}
              strokeWidth={1}
              strokeDasharray={outline ? '2 3' : undefined}
              fill={color}
              fillOpacity={outline ? 0.07 : look === 'poster' ? 0.4 : look === 'glass' ? 0.26 : 0.18}
              isAnimationActive={false}
              activeDot={false}
              connectNulls={false}
            />
          ) : null}
          <ReferenceLine
            x={now}
            stroke="var(--kit-text-2)"
            strokeWidth={1.25}
            label={{ value: 'Now', position: 'insideTopLeft', fontSize: 12, fontWeight: 600, fill: 'var(--kit-text-2)', offset: 6 }}
          />
          {limit ? (
            <ReferenceLine
              y={limit.value}
              stroke={toneLine(limit.tone ?? 'critical')}
              strokeWidth={look === 'poster' ? 2 : 1.25}
              strokeDasharray={look === 'blueprint' ? '10 3 2 3' : '5 4'}
              ifOverflow="extendDomain"
              label={{ value: limitText, position: 'right', fontSize: 12, fontWeight: 600, fill: toneLine(limit.tone ?? 'critical'), offset: 8 }}
            />
          ) : null}
          {scenarios.map((scenario) => (
            <Line
              key={scenario.id}
              dataKey={scenario.id}
              type={chart.curve}
              stroke={toneLine(scenario.tone)}
              strokeWidth={Math.max(1.5, chart.strokeWidth - 0.5)}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: toneLine(scenario.tone) }}
            />
          ))}
          <Line
            dataKey="history"
            type={chart.curve}
            stroke={color}
            strokeWidth={chart.strokeWidth}
            dot={chart.points ? { r: 2.5, strokeWidth: 1.25, stroke: color, fill: 'var(--base-background)' } : false}
            isAnimationActive={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
            style={look === 'glass' ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
          />
          <Line
            dataKey="forecast"
            type={chart.curve}
            stroke={color}
            strokeWidth={chart.strokeWidth}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
          />
          {actual ? <Line dataKey="actual" type={chart.curve} stroke="var(--kit-text)" strokeWidth={Math.max(1.5, chart.strokeWidth - 0.5)} dot={false} isAnimationActive={false} /> : null}
          {last !== undefined ? (
            <ReferenceDot
              x={now}
              y={last}
              shape={({ cx = 0, cy = 0 }: { cx?: number; cy?: number }) => (
                <g>
                  <circle cx={cx} cy={cy} r={9} fill={color} opacity={0.22} />
                  <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="var(--base-background)" strokeWidth={2} />
                </g>
              )}
            />
          ) : null}
          {limit && crossing ? <ReferenceLine x={now + crossing.steps} stroke={toneLine(limit.tone ?? 'critical')} strokeWidth={1} strokeDasharray="2 3" /> : null}
          {limit && crossing ? (
            <ReferenceDot
              x={now + crossing.steps}
              y={limit.value}
              ifOverflow="extendDomain"
              shape={({ cx = 0, cy = 0 }: { cx?: number; cy?: number }) => {
                const mark = toneLine(limit.tone ?? 'critical');
                const width = crossing.label.length * 7.2 + 18;
                const left = cx - width - 10;
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={5.5} fill="var(--base-background)" stroke={mark} strokeWidth={2.5} />
                    <rect x={left} y={cy - 32} width={width} height={22} rx={Math.min(chart.barRadius, 11)} fill={mark} />
                    <text x={left + width / 2} y={cy - 17} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--base-background)">
                      {crossing.label}
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
