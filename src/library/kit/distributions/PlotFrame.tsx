import type { ReactNode } from 'react';

import { useLookDefinition } from '../../looks/useLook';
import { ChartFrame } from '../ChartFrame';
import type { LegendItem } from '../Legend';
import { formatNumber } from '../tones';

import { percent } from './stats';

export type PlotAxis = {
  min: number;
  max: number;
  /** Values that get a tick label and, where the look draws one, a grid line. */
  ticks: readonly number[];
  decimals?: number;
  /** The quantity and its unit: "Discharge pressure, barg". */
  title?: string;
};

type PlotFrameProps = {
  /** What the plot shows, in words. */
  label: string;
  x: PlotAxis;
  y: PlotAxis;
  /** Height of the whole chart in px, axes included. */
  height?: number;
  legend?: readonly LegendItem[];
  headline?: ReactNode;
  notes?: ReactNode;
  className?: string;
  /** Marks, positioned absolutely inside the plot area with percentages. */
  children: ReactNode;
};

/**
 * Two numeric axes around a plot area, drawn in HTML so tick labels keep their size at any width.
 * Grid lines and axis lines follow the look; the marks are the children.
 */
export function PlotFrame({ label, x, y, height = 280, legend, headline, notes, className, children }: PlotFrameProps) {
  const { chart } = useLookDefinition();
  const yLabels = y.ticks.map((tick) => formatNumber(tick, y.decimals ?? 0));
  const gutter = Math.max(...yLabels.map((text) => text.length), 1) + 2;
  const axis = chart.axisLine ? 'var(--kit-rule-strong)' : 'var(--kit-rule)';

  return (
    <ChartFrame label={label} legend={legend} headline={headline} notes={notes} height={height} className={className}>
      <div
        className="grid h-full text-xs tabular-nums leading-4 text-[var(--kit-text-2)]"
        style={{ gridTemplateColumns: `${gutter}ch minmax(0, 1fr)`, gridTemplateRows: 'auto minmax(0, 1fr) auto' }}
      >
        <div className="col-span-2 mb-3 min-h-2 font-medium">{y.title}</div>
        <div className="relative">
          {y.ticks.map((tick, index) => (
            <span key={tick} className="absolute right-2 translate-y-1/2 whitespace-nowrap" style={{ bottom: percent(tick, y.min, y.max) }}>
              {yLabels[index]}
            </span>
          ))}
        </div>
        <div data-plot="" className="relative mr-5" style={{ borderBottom: `1px solid ${axis}`, borderLeft: chart.axisLine ? `1px solid ${axis}` : undefined }}>
          {chart.grid === 'none'
            ? null
            : y.ticks
                .filter((tick) => tick > y.min)
                .map((tick) => <span key={tick} data-grid="y" className="absolute inset-x-0 h-px bg-[var(--kit-grid)]" style={{ bottom: percent(tick, y.min, y.max) }} />)}
          {chart.grid === 'both'
            ? x.ticks
                .filter((tick) => tick > x.min)
                .map((tick) => <span key={tick} data-grid="x" className="absolute inset-y-0 w-px bg-[var(--kit-grid)]" style={{ left: percent(tick, x.min, x.max) }} />)
            : null}
          {children}
        </div>
        <div />
        <div className="mr-5">
          <div className="relative h-6">
            {x.ticks.map((tick) => (
              <span key={tick} className="absolute top-1.5 -translate-x-1/2 whitespace-nowrap" style={{ left: percent(tick, x.min, x.max) }}>
                {formatNumber(tick, x.decimals ?? 0)}
              </span>
            ))}
          </div>
          {x.title ? <div className="pt-1 text-center font-medium">{x.title}</div> : null}
        </div>
      </div>
    </ChartFrame>
  );
}
