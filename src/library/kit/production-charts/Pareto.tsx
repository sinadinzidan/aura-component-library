import type { ReactNode } from 'react';

import { useLookDefinition } from '../../looks/useLook';
import { ChartFrame } from '../ChartFrame';
import { cx, formatNumber, niceTicks, toneLine, type Tone } from '../tones';

import { paretoRows, type ParetoItem } from './paretoLogic';

type ParetoProps = {
  /** What the chart shows, in words. */
  label: string;
  /** Causes with their amount, in any order; the chart sorts them. */
  items: readonly ParetoItem[];
  unit?: string;
  decimals?: number;
  /** Running share that separates the vital few from the rest, percent. */
  threshold?: number;
  /** Colour of the vital few; the rest is neutral. */
  tone?: Tone;
  height?: number;
  headline?: ReactNode;
  notes?: ReactNode;
  className?: string;
};

/**
 * A Pareto chart: bars sorted largest first on the left axis, the running share as a line on the
 * right axis, and a dashed threshold. The bars that make up the threshold share are coloured, the
 * tail is neutral, so "fix these first" is readable without the numbers.
 */
export function Pareto({ label, items, unit = '', decimals = 0, threshold = 80, tone = 'accent', height = 300, headline, notes, className }: ParetoProps) {
  const { chart } = useLookDefinition();
  const rows = paretoRows(items, threshold);
  const ticks = niceTicks(Math.max(...rows.map((row) => row.value), 0));
  const top = ticks[ticks.length - 1] || 1;
  const centre = (index: number) => ((index + 0.5) / rows.length) * 100;
  const line = rows.map((row, index) => `${centre(index)},${100 - row.cumulative}`).join(' ');

  return (
    <ChartFrame
      label={label}
      headline={headline}
      notes={notes}
      height={height}
      className={className}
      legend={[
        { label: `Vital few, first ${threshold} %`, tone },
        { label: 'Remaining causes', tone: 'neutral' },
        { label: 'Running share', tone: 'amber', mark: 'line' },
      ]}
    >
      <div className="grid h-full text-xs leading-4 text-(--kit-text-2) tabular-nums" style={{ gridTemplateColumns: 'auto minmax(0, 1fr) auto', gridTemplateRows: 'auto minmax(0, 1fr) auto' }}>
        <span className="mb-4 font-medium">{unit}</span>
        <span />
        <span className="mb-4 text-right font-medium">Running %</span>

        <div className="relative w-9">
          {ticks.map((tick) => (
            <span key={tick} className="absolute right-2 translate-y-1/2" style={{ bottom: `${(tick / top) * 100}%` }}>
              {formatNumber(tick, decimals)}
            </span>
          ))}
        </div>
        <div className={cx('relative border-b', chart.axisLine ? 'border-(--kit-rule-strong)' : 'border-(--kit-rule)')}>
          {chart.grid === 'none'
            ? null
            : ticks.slice(1).map((tick) => <span key={tick} aria-hidden="true" className="absolute inset-x-0 h-px bg-(--kit-grid)" style={{ bottom: `${(tick / top) * 100}%` }} />)}
          <div className="absolute inset-0 flex items-end">
            {rows.map((row) => (
              <div key={row.label} data-tone={row.vital ? tone : 'neutral'} data-vital={row.vital ? '' : undefined} className="relative flex h-full flex-1 items-end justify-center">
                <span
                  className={row.vital ? 'bg-(--t-solid)' : 'bg-(--kit-text-3)'}
                  style={{ height: `${(row.value / top) * 100}%`, width: `${Math.round(chart.barFill * 100)}%`, borderRadius: `${chart.barRadius}px ${chart.barRadius}px 0 0` }}
                />
              </div>
            ))}
          </div>
          <span aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-(--kit-text-2)" style={{ bottom: `${threshold}%` }} />
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <polyline points={line} fill="none" stroke={toneLine('amber')} strokeWidth={chart.strokeWidth} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
          {rows.map((row, index) => (
            <span key={row.label} className="absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center" style={{ left: `${centre(index)}%`, bottom: `${row.cumulative}%` }}>
              <span className="absolute bottom-full mb-1 rounded-sm bg-(--kit-halo) px-1 font-medium whitespace-nowrap text-(--kit-text)">{formatNumber(row.cumulative)} %</span>
              <span className="h-2.5 w-2.5 rounded-full border-2 border-(--kit-halo)" style={{ background: toneLine('amber') }} />
            </span>
          ))}
        </div>
        <div className="relative w-10">
          {[...new Set([0, 50, 100, threshold])].map((tick) => (
            <span key={tick} className={cx('absolute left-2 translate-y-1/2', tick === threshold && 'font-medium text-(--kit-text)')} style={{ bottom: `${tick}%` }}>
              {tick}
            </span>
          ))}
        </div>

        <span />
        <div className="flex pt-2">
          {rows.map((row) => (
            <span key={row.label} className="min-w-0 flex-1 px-1 text-center">
              <span className="block font-medium text-(--kit-text)">{row.label}</span>
              <span className="block">
                {formatNumber(row.value, decimals)}
                {unit ? ` ${unit}` : ''}
              </span>
            </span>
          ))}
        </div>
        <span />
      </div>
    </ChartFrame>
  );
}
