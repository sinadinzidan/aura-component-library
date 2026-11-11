import type { ReactNode } from 'react';

import { useLookDefinition } from '../../looks/useLook';
import { ChartFrame } from '../ChartFrame';
import { cx, formatNumber, type Tone } from '../tones';

import { symmetricExtent } from './paretoLogic';

type DeviationBarsProps = {
  /** What the chart shows, in words. */
  label: string;
  categories: readonly string[];
  /** Deviation from the reference per category, signed. */
  values: readonly number[];
  /** Name of the zero line: "Plan 4.50". */
  reference: string;
  unit?: string;
  decimals?: number;
  /** Deviations inside ± this stay neutral. */
  tolerance?: number;
  /** Axis step the extent is rounded up to. */
  step?: number;
  /** Which side of zero is the good one. */
  good?: 'up' | 'down';
  height?: number;
  headline?: ReactNode;
  notes?: ReactNode;
  className?: string;
};

/**
 * Bars that grow up or down from a reference line: the plan, the target, last year. Bars inside
 * the tolerance are neutral, so colour lands only on the periods that need explaining.
 */
export function DeviationBars({ label, categories, values, reference, unit = '', decimals = 1, tolerance = 0, step = 1, good = 'up', height = 260, headline, notes, className }: DeviationBarsProps) {
  const { chart } = useLookDefinition();
  const extent = symmetricExtent(values, step);
  const share = (value: number) => (Math.abs(value) / extent) * 50;
  const toneOf = (value: number): Tone => (Math.abs(value) <= tolerance ? 'neutral' : value > 0 === (good === 'up') ? 'success' : 'critical');
  const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatNumber(Math.abs(value), decimals)}`;

  return (
    <ChartFrame
      label={label}
      headline={headline}
      notes={notes}
      height={height}
      className={className}
      legend={[
        { label: good === 'up' ? 'Above, outside tolerance' : 'Below, outside tolerance', tone: 'success' },
        { label: good === 'up' ? 'Below, outside tolerance' : 'Above, outside tolerance', tone: 'critical' },
        { label: tolerance ? `Within ±${formatNumber(tolerance, decimals)}` : 'On reference', tone: 'neutral' },
      ]}
    >
      <div className="grid h-full text-xs leading-4 text-(--kit-text-2) tabular-nums" style={{ gridTemplateColumns: 'auto minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr) auto' }}>
        <div className="relative w-12">
          {[extent, 0, -extent].map((tick) => (
            <span key={tick} className="absolute right-2 translate-y-1/2 whitespace-nowrap" style={{ bottom: `${50 + (tick / extent) * 50}%` }}>
              {signed(tick)}
            </span>
          ))}
        </div>
        <div className="relative my-3">
          {tolerance ? <span aria-hidden="true" className="absolute inset-x-0 bg-(--kit-track)" style={{ top: `${50 - share(tolerance)}%`, height: `${share(tolerance) * 2}%` }} /> : null}
          <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-(--kit-text)" />
          <span className="absolute right-0 bottom-1/2 mb-1 font-medium text-(--kit-text)">
            {reference}
            {unit ? ` ${unit}` : ''}
          </span>
          <div className="absolute inset-0 flex">
            {values.map((value, index) => (
              <div key={categories[index]} data-tone={toneOf(value)} className="relative flex-1">
                <span
                  data-bar=""
                  className={cx('absolute left-1/2 -translate-x-1/2', toneOf(value) === 'neutral' ? 'bg-(--kit-text-3)' : 'bg-(--t-solid)')}
                  style={{
                    width: `${Math.round(chart.barFill * 100)}%`,
                    height: `${share(value)}%`,
                    minHeight: 2,
                    ...(value >= 0 ? { bottom: '50%', borderRadius: `${chart.barRadius}px ${chart.barRadius}px 0 0` } : { top: '50%', borderRadius: `0 0 ${chart.barRadius}px ${chart.barRadius}px` }),
                  }}
                />
                <span
                  className={cx('absolute inset-x-0 text-center font-semibold whitespace-nowrap', toneOf(value) === 'neutral' ? 'text-(--kit-text-2)' : 'text-(--kit-text)')}
                  style={value >= 0 ? { bottom: `calc(${50 + share(value)}% + 2px)` } : { top: `calc(${50 + share(value)}% + 2px)` }}
                >
                  {signed(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <span />
        <div className="flex border-t border-(--kit-rule) pt-2">
          {categories.map((category) => (
            <span key={category} className="min-w-0 flex-1 text-center">
              {category}
            </span>
          ))}
        </div>
      </div>
    </ChartFrame>
  );
}
