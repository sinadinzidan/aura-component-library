import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { CartesianGrid, ReferenceArea, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from 'recharts';

import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

import { SeriesLegend } from './SeriesLegend';
import { axisScale } from './TrendChart';

export type ScatterPoint = {
  x: number;
  y: number;
  /** Third measure, drawn as the bubble area. */
  size?: number;
  /** Shown in the tooltip, e.g. the asset or the time. */
  name?: string;
};

export type ScatterGroup = {
  key: string;
  label: string;
  points: readonly ScatterPoint[];
  /** A chart colour token. Defaults to `chartSeriesColor(position)`. */
  color?: string;
  /** Draws the group as solid, larger dots: the current operating point, a flagged asset. */
  emphasis?: boolean;
};

export type ScatterReference = { axis: 'x' | 'y'; value: number; label: string; tone?: 'neutral' | 'warning' | 'critical' };

export type ScatterPlotProps = {
  /** What is plotted against what, with the key finding. Becomes the accessible name. */
  label: string;
  groups: readonly ScatterGroup[];
  /** Axis titles including the unit: "Flow (kSm³/h)". */
  xLabel: string;
  yLabel: string;
  /** Name of the bubble-size measure, for the tooltip. */
  sizeLabel?: string;
  /** Shaded rectangle the points are expected to stay inside. */
  envelope?: { x1: number; x2: number; y1: number; y2: number; label?: string };
  references?: readonly ScatterReference[];
  xDomain?: readonly [number, number];
  yDomain?: readonly [number, number];
  xTicks?: readonly number[];
  yTicks?: readonly number[];
  /** Smallest and largest bubble area in square pixels. */
  sizeRange?: readonly [number, number];
  decimals?: number;
  legend?: boolean;
  summary?: string;
  heightClassName?: string;
  className?: string;
};

const REFERENCE_STROKE = {
  neutral: 'var(--color-chart-neutral-450)',
  warning: 'var(--color-chart-warning-450)',
  critical: 'var(--color-chart-critical-450)',
} as const;

const LABEL_CLASS = 'fill-muted-foreground';

/**
 * Scatter and bubble chart: one measurement against another, optionally sized by a third. An
 * operating envelope and limit lines show where the points should be; an emphasised group marks
 * where the process is now.
 */
export function ScatterPlot({
  label,
  groups,
  xLabel,
  yLabel,
  sizeLabel = 'Size',
  envelope,
  references = [],
  xDomain,
  yDomain,
  xTicks,
  yTicks,
  sizeRange = [40, 40],
  decimals = 1,
  legend = false,
  summary,
  heightClassName = 'h-64',
  className,
}: ScatterPlotProps) {
  const coloured = groups.map((group, index) => ({ ...group, color: group.color ?? chartSeriesColor(index + 1) }));
  const all = coloured.flatMap((group) => group.points);
  const xScale = axisScale([...all.map((point) => point.x), ...(envelope ? [envelope.x1, envelope.x2] : [])], xDomain, xTicks);
  const yScale = axisScale([...all.map((point) => point.y), ...(envelope ? [envelope.y1, envelope.y2] : [])], yDomain, yTicks);
  const hasSize = all.some((point) => point.size !== undefined);

  const config: ChartConfig = { x: { label: xLabel }, y: { label: yLabel }, size: { label: sizeLabel } };
  for (const group of coloured) config[group.key] = { label: group.label, color: group.color };
  const formatAxis = (value: number) => formatValue(value, Number.isInteger(value) ? 0 : decimals);

  return (
    <figure data-slot="scatter-plot" className={cn('m-0 flex w-full min-w-0 flex-col gap-2', className)}>
      <div className="text-xs text-muted-foreground" aria-hidden="true">
        {yLabel}
      </div>
      <div className={cn('w-full', heightClassName)}>
        <ChartContainer config={config} aria-label={label} className="aspect-auto h-full w-full">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey="x" name="x" domain={xScale.domain} ticks={xScale.ticks} tickFormatter={formatAxis} tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis type="number" dataKey="y" name="y" domain={yScale.domain} ticks={yScale.ticks} tickFormatter={formatAxis} tickLine={false} axisLine={false} width={44} />
            {hasSize ? <ZAxis type="number" dataKey="size" name="size" range={[sizeRange[0], sizeRange[1]]} /> : <ZAxis range={[36, 36]} />}
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideIndicator labelFormatter={(_, payload) => (typeof payload[0]?.payload?.name === 'string' ? payload[0].payload.name : null)} valueFormatter={(value) => (typeof value === 'number' ? formatValue(value, decimals) : String(value))} />}
            />
            {envelope ? (
              <ReferenceArea
                x1={envelope.x1}
                x2={envelope.x2}
                y1={envelope.y1}
                y2={envelope.y2}
                fill="var(--color-chart-neutral-100)"
                fillOpacity={1}
                stroke="var(--color-chart-neutral-300)"
                strokeDasharray="4 4"
                label={envelope.label ? { value: envelope.label, position: 'insideTopLeft', className: LABEL_CLASS } : undefined}
              />
            ) : null}
            {references.map((reference) => {
              const shared = { stroke: REFERENCE_STROKE[reference.tone ?? 'warning'], strokeDasharray: '4 4' };
              return reference.axis === 'x' ? (
                <ReferenceLine key={reference.label} x={reference.value} {...shared} label={{ value: reference.label, position: 'insideTopRight', className: LABEL_CLASS }} />
              ) : (
                <ReferenceLine key={reference.label} y={reference.value} {...shared} label={{ value: reference.label, position: 'insideBottomRight', className: LABEL_CLASS }} />
              );
            })}
            {coloured.map((group) => (
              <Scatter
                key={group.key}
                name={group.label}
                data={[...group.points]}
                fill={group.color}
                fillOpacity={group.emphasis ? 1 : 0.35}
                stroke={group.color}
                strokeWidth={group.emphasis ? 2 : 1}
                isAnimationActive={false}
              />
            ))}
          </ScatterChart>
        </ChartContainer>
      </div>
      <div className="text-center text-xs text-muted-foreground" aria-hidden="true">
        {xLabel}
      </div>
      {legend ? <SeriesLegend items={coloured.map((group) => ({ key: group.key, label: group.label, color: group.color, mark: 'dot' }))} /> : null}
      {summary ? <figcaption className="text-xs text-muted-foreground">{summary}</figcaption> : null}
    </figure>
  );
}
