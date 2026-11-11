import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

import { makePlotScale, ticksIn } from './plotScale';
import type { Domain, PlotScale } from './plotScale';

export type PlotAxis = {
  domain: Domain;
  /** Tick values. Defaults to round values inside the domain. */
  ticks?: readonly number[];
  /** Tick label. Defaults to a plain number. */
  format?: (value: number) => string;
  /** Quantity and unit, e.g. "Frequency, Hz". */
  title?: string;
};

export type PlotFrameProps = {
  /** What the plot shows, with the key finding. Becomes the accessible name. */
  label: string;
  x: PlotAxis;
  y: PlotAxis;
  /** SVG marks, drawn in a 100 × 100 box that stretches to the plot area. Positions come from the scale. */
  children: (scale: PlotScale) => ReactNode;
  /** HTML placed over the plot area: labels, dots and controls positioned in percent with the same scale. */
  overlay?: (scale: PlotScale) => ReactNode;
  /** Set when the overlay holds controls; the frame is then a group instead of an image. */
  interactive?: boolean;
  /** Hide both axes and the grid: the marks alone, for a card or a table row. */
  bare?: boolean;
  grid?: boolean;
  /** Tailwind height of the plot area, e.g. `h-48`. */
  heightClassName?: string;
  /** Tailwind width of the y-axis gutter. Plots stacked on one x axis must share it. */
  gutterClassName?: string;
  className?: string;
};

const defaultFormat = (value: number): string => formatValue(value, Number.isInteger(value) ? 0 : Math.abs(value) < 1 ? 2 : 1);

function edgeShift(percent: number): string {
  if (percent < 4) return '';
  if (percent > 96) return '-translate-x-full';
  return '-translate-x-1/2';
}

/**
 * The frame every condition-monitoring plot is drawn in: a stretchable SVG plot area with HTML
 * axis labels around it, so lines scale with the container while text stays crisp. Marks are
 * positioned through one scale shared by the SVG layer and the HTML overlay.
 */
export function PlotFrame({
  label,
  x,
  y,
  children,
  overlay,
  interactive = false,
  bare = false,
  grid = true,
  heightClassName = 'h-48',
  gutterClassName = 'w-10',
  className,
}: PlotFrameProps) {
  const scale = makePlotScale(x.domain, y.domain);
  const xTicks = x.ticks ?? ticksIn(x.domain);
  const yTicks = y.ticks ?? ticksIn(y.domain);
  const formatX = x.format ?? defaultFormat;
  const formatY = y.format ?? defaultFormat;

  return (
    <div role={interactive ? 'group' : 'img'} aria-label={label} data-slot="plot-frame" className={cn('flex w-full min-w-0 flex-col', className)}>
      {!bare && y.title ? <span className="pb-1.5 text-xs text-muted-foreground">{y.title}</span> : null}
      <div className="flex min-w-0">
        {bare ? null : (
          <div aria-hidden="true" data-slot="plot-y-axis" className={cn('relative shrink-0', gutterClassName)}>
            {yTicks.map((tick) => (
              <span key={tick} className="absolute right-2 -translate-y-1/2 text-xs leading-none text-muted-foreground tabular-nums" style={{ top: `${scale.y(tick)}%` }}>
                {formatY(tick)}
              </span>
            ))}
          </div>
        )}
        <div data-slot="plot-area" className={cn('relative min-w-0 flex-1', heightClassName)}>
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" className="absolute inset-0 size-full overflow-visible">
            {!bare && grid
              ? yTicks.map((tick) => (
                  <line key={tick} data-slot="plot-grid" x1={0} x2={100} y1={scale.y(tick)} y2={scale.y(tick)} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-100" />
                ))
              : null}
            {bare ? null : <line x1={0} x2={100} y1={100} y2={100} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-300" />}
            {children(scale)}
          </svg>
          {overlay ? overlay(scale) : null}
        </div>
      </div>
      {bare ? null : (
        <div className="flex min-w-0">
          <span aria-hidden="true" className={cn('shrink-0', gutterClassName)} />
          <div aria-hidden="true" data-slot="plot-x-axis" className="relative h-5 min-w-0 flex-1">
            {xTicks.map((tick) => (
              <span
                key={tick}
                className={cn('absolute top-1.5 whitespace-nowrap text-xs leading-none text-muted-foreground tabular-nums', edgeShift(scale.x(tick)))}
                style={{ left: `${scale.x(tick)}%` }}
              >
                {formatX(tick)}
              </span>
            ))}
          </div>
        </div>
      )}
      {!bare && x.title ? <span className="pt-1 text-right text-xs text-muted-foreground">{x.title}</span> : null}
    </div>
  );
}
