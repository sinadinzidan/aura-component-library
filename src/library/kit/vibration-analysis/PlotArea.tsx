import type { ReactNode } from 'react';

import { useLookDefinition } from '../../looks/useLook';
import { cx } from '../tones';

/** A tick on an axis: `at` runs 0–1 from the origin, `label` is already formatted. */
export type PlotTick = { at: number; label: string };

type PlotAreaProps = {
  /** What the plot shows, in words. */
  label: string;
  yTicks: readonly PlotTick[];
  xTicks: readonly PlotTick[];
  /** Unit of the y axis, written above it. */
  yCaption?: string;
  /** Unit of the x axis, written at its end. */
  xCaption?: string;
  /** Plot height in px. */
  height?: number;
  /** SVG content in a 0–100 square (y grows downwards); strokes keep their width when stretched. */
  children: ReactNode;
  /** HTML drawn over the plot: labels and buttons placed with left/top percentages. */
  overlay?: ReactNode;
  className?: string;
};

/**
 * Axes for a hand-drawn plot: tick labels in real text sizes around an SVG that stretches to the
 * panel. Grid and axis lines follow the look; analysis plots that recharts cannot draw sit in it.
 */
export function PlotArea({ label, yTicks, xTicks, yCaption, xCaption, height = 240, children, overlay, className }: PlotAreaProps) {
  const { id: look, chart } = useLookDefinition();
  const gutter = `${Math.max(...yTicks.map((tick) => tick.label.length), 2) + 1.5}ch`;
  const axis = chart.axisLine ? 'var(--kit-rule-strong)' : 'var(--kit-grid)';

  return (
    <div data-look={look} className={cx('flex min-w-0 flex-col gap-1 text-xs text-(--kit-text-2) tabular-nums', className)}>
      {yCaption ? <span className="mb-2 font-medium">{yCaption}</span> : null}
      <div className="flex min-w-0">
        <div aria-hidden="true" className="relative shrink-0" style={{ width: gutter, height }}>
          {yTicks.map((tick) => (
            <span key={tick.label} className="absolute right-2 -translate-y-1/2 whitespace-nowrap" style={{ top: `${(1 - tick.at) * 100}%` }}>
              {tick.label}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div role="img" aria-label={label} className="relative" style={{ height, borderLeft: `1px solid ${axis}`, borderBottom: `1px solid ${axis}` }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
              {chart.grid === 'none'
                ? null
                : yTicks
                    .filter((tick) => tick.at > 0)
                    .map((tick) => <line key={tick.label} x1="0" x2="100" y1={(1 - tick.at) * 100} y2={(1 - tick.at) * 100} stroke="var(--kit-grid)" vectorEffect="non-scaling-stroke" />)}
              {chart.grid === 'both'
                ? xTicks
                    .filter((tick) => tick.at > 0)
                    .map((tick) => <line key={tick.label} y1="0" y2="100" x1={tick.at * 100} x2={tick.at * 100} stroke="var(--kit-grid)" vectorEffect="non-scaling-stroke" />)
                : null}
              {children}
            </svg>
            {overlay}
          </div>
          <div aria-hidden="true" className="relative mt-1.5 h-4">
            {xTicks.map((tick) => (
              <span
                key={tick.label}
                className={cx('absolute whitespace-nowrap', tick.at <= 0.02 ? '' : tick.at >= 0.98 ? '-translate-x-full' : '-translate-x-1/2')}
                style={{ left: `${tick.at * 100}%` }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      {xCaption ? <span className="self-end font-medium">{xCaption}</span> : null}
    </div>
  );
}
