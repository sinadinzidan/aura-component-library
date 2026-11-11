import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

import type { SpectrumLine } from './dft';
import { ticksIn } from './plotScale';

export type WaterfallTrace = {
  id: string;
  /** Row label, e.g. the date of the measurement. */
  label: string;
  spectrum: readonly SpectrumLine[];
};

export type WaterfallPlotProps = {
  /** What the waterfall shows, with the key finding. Becomes the accessible name. */
  label: string;
  /** Oldest first. The newest trace is drawn in front and in the data colour. */
  traces: readonly WaterfallTrace[];
  maxHz?: number;
  /** Amplitude that fills one row's height. Defaults to the highest line of any trace. */
  maxAmplitude?: number;
  unit: string;
  /** Tailwind class for the fill that hides the traces behind each one. Match the surface it sits on. */
  surfaceClassName?: string;
  heightClassName?: string;
  className?: string;
};

/** Share of the width and height the stack is sheared over. */
const SHEAR_X = 16;
const SHEAR_Y = 62;
/** Height one trace may rise, as a share of the plot. */
const RISE = 34;

/**
 * Spectra stacked over time, each offset up and to the right: a waterfall. A peak that grows from
 * trace to trace shows as a ridge, so a developing fault is visible long before an alarm.
 * Traces hide what is behind them, as on an analyser.
 */
export function WaterfallPlot({ label, traces, maxHz, maxAmplitude, unit, surfaceClassName = 'fill-base-background', heightClassName = 'h-72', className }: WaterfallPlotProps) {
  const lastHz = maxHz ?? Math.max(1, ...traces.map((trace) => trace.spectrum[trace.spectrum.length - 1]?.frequencyHz ?? 0));
  const top = maxAmplitude ?? Math.max(1e-9, ...traces.flatMap((trace) => trace.spectrum.filter((line) => line.frequencyHz <= lastHz).map((line) => line.amplitude)));
  const steps = Math.max(1, traces.length - 1);
  const plotWidth = 100 - SHEAR_X;
  // Index 0 is the oldest: it sits at the back, shifted furthest up and right.
  const offset = (index: number) => {
    const depth = (traces.length - 1 - index) / steps;
    return { dx: depth * SHEAR_X, dy: depth * SHEAR_Y };
  };
  const pointsOf = (trace: WaterfallTrace, index: number): string => {
    const { dx, dy } = offset(index);
    return trace.spectrum
      .filter((line) => line.frequencyHz <= lastHz)
      .map((line) => `${(dx + (line.frequencyHz / lastHz) * plotWidth).toFixed(2)},${(100 - dy - Math.min(1, line.amplitude / top) * RISE).toFixed(2)}`)
      .join(' ');
  };

  return (
    <div role="img" aria-label={label} data-slot="waterfall-plot" className={cn('flex w-full min-w-0 flex-col', className)}>
      <span className="pb-1.5 text-xs text-muted-foreground">
        Amplitude, {unit}; tallest ridge {formatValue(top, 1)}
      </span>
      <div className="flex min-w-0">
        <div className={cn('relative min-w-0 flex-1', heightClassName)}>
          <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" className="absolute inset-0 size-full overflow-visible">
            {traces.map((trace, index) => {
              const { dx, dy } = offset(index);
              const newest = index === traces.length - 1;
              const line = pointsOf(trace, index);
              return (
                <g key={trace.id} data-slot="waterfall-trace" data-newest={newest || undefined}>
                  <polygon points={`${dx},${100 - dy} ${line} ${dx + plotWidth},${100 - dy}`} className={surfaceClassName} />
                  <polyline points={line} strokeWidth={newest ? 1.5 : 1} strokeLinejoin="round" vectorEffect="non-scaling-stroke" className={newest ? 'stroke-chart-1-450' : 'stroke-chart-neutral-450'} />
                </g>
              );
            })}
          </svg>
        </div>
        <ol aria-hidden="true" className={cn('relative w-14 shrink-0', heightClassName)}>
          {traces.map((trace, index) => (
            <li
              key={trace.id}
              className={cn('absolute left-1.5 -translate-y-full whitespace-nowrap text-xs leading-none tabular-nums', index === traces.length - 1 ? 'font-medium text-base-foreground' : 'text-muted-foreground')}
              style={{ top: `${100 - offset(index).dy}%` }}
            >
              {trace.label}
            </li>
          ))}
        </ol>
      </div>
      <div className="flex min-w-0">
        <div aria-hidden="true" className="relative h-5 min-w-0 flex-1">
          {ticksIn([0, lastHz]).map((tick) => (
            <span key={tick} className={cn('absolute top-1.5 text-xs leading-none text-muted-foreground tabular-nums', tick === 0 ? '' : '-translate-x-1/2')} style={{ left: `${(tick / lastHz) * plotWidth}%` }}>
              {formatValue(tick, 0)}
            </span>
          ))}
        </div>
        <span className="w-14 shrink-0" />
      </div>
      <span className="pt-1 text-xs text-muted-foreground">Frequency, Hz; oldest at the back</span>
    </div>
  );
}
