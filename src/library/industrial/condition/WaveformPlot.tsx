import { formatValue } from '../status';

import { PlotFrame } from './PlotFrame';
import { niceCeiling, polylinePoints } from './plotScale';

export type WaveformPlotProps = {
  /** What the waveform shows. Becomes the accessible name. */
  label: string;
  samples: readonly number[];
  sampleRateHz: number;
  /** Unit of the samples, e.g. "mm/s". */
  unit: string;
  /** Draws a tick at every shaft revolution, so repeating events can be counted against speed. */
  runningHz?: number;
  /** Dashed lines at ± this value, e.g. the RMS level. */
  level?: { value: number; label: string };
  /** Symmetric y range. Defaults to a round value above the peak. */
  range?: number;
  heightClassName?: string;
  className?: string;
};

/**
 * A time waveform: amplitude against milliseconds, centred on zero. The raw signal shows what a
 * spectrum hides — impacts, clipping, beating — and revolution marks tie it to shaft speed.
 */
export function WaveformPlot({ label, samples, sampleRateHz, unit, runningHz, level, range, heightClassName = 'h-48', className }: WaveformPlotProps) {
  const durationMs = samples.length > 1 ? ((samples.length - 1) / sampleRateHz) * 1000 : 1;
  const limit = range ?? niceCeiling(samples.reduce((largest, sample) => Math.max(largest, Math.abs(sample)), 0));
  const times = samples.map((_, index) => (index / sampleRateHz) * 1000);
  const revolutions = runningHz && runningHz > 0 ? Array.from({ length: Math.floor((durationMs / 1000) * runningHz) + 1 }, (_, index) => (index / runningHz) * 1000) : [];

  return (
    <PlotFrame
      label={label}
      x={{ domain: [0, durationMs], title: 'Time, ms', format: (value) => formatValue(value, 0) }}
      y={{ domain: [-limit, limit], ticks: [-limit, -limit / 2, 0, limit / 2, limit], title: `Velocity, ${unit}` }}
      heightClassName={heightClassName}
      className={className}
      overlay={(scale) =>
        level ? (
          <span className="absolute right-0 -translate-y-full pb-0.5 text-xs leading-none text-muted-foreground tabular-nums" style={{ top: `${scale.y(level.value)}%` }}>
            {level.label}
          </span>
        ) : null
      }
    >
      {(scale) => (
        <>
          {revolutions.map((time) => (
            <line key={time} data-slot="waveform-revolution" x1={scale.x(time)} x2={scale.x(time)} y1={96} y2={100} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-450" />
          ))}
          <line x1={0} x2={100} y1={scale.y(0)} y2={scale.y(0)} strokeWidth={1} vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-300" />
          {level
            ? [level.value, -level.value].map((value) => (
                <line key={value} data-slot="waveform-level" x1={0} x2={100} y1={scale.y(value)} y2={scale.y(value)} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" className="stroke-chart-neutral-450" />
              ))
            : null}
          <polyline data-slot="waveform-line" points={polylinePoints(times, samples, scale)} strokeWidth={1.25} strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-chart-1-450" />
        </>
      )}
    </PlotFrame>
  );
}
