import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

import { PlotFrame } from './PlotFrame';
import { niceCeiling, polylinePoints } from './plotScale';
import { peakResponse } from './rotor';
import type { RotorResponse } from './rotor';

export type BodePlotProps = {
  /** What the plot shows, with the key finding. Becomes the accessible name. */
  label: string;
  /** 1× amplitude and phase at each speed of a run-up or coast-down, in order. */
  points: readonly RotorResponse[];
  /** Amplitude unit, e.g. "µm pp". */
  unit: string;
  /** Normal operating speed, marked on both plots. */
  operatingRpm?: number;
  /** Marks the amplitude peak as the critical speed. */
  markCritical?: boolean;
  heightClassName?: string;
  className?: string;
};

const GUTTER = 'w-11';

/**
 * A Bode plot of a run-up: 1× amplitude and phase lag against shaft speed, on a shared speed
 * axis. A critical speed is an amplitude peak together with a phase shift of about 180°; the
 * distance from it to operating speed is the separation margin.
 */
export function BodePlot({ label, points, unit, operatingRpm, markCritical = true, heightClassName = 'h-32', className }: BodePlotProps) {
  const speeds = points.map((point) => point.speedRpm);
  const domain: readonly [number, number] = [speeds[0] ?? 0, speeds[speeds.length - 1] ?? 1];
  const top = niceCeiling(Math.max(0, ...points.map((point) => point.amplitude)), 1.2);
  const critical = markCritical ? peakResponse(points) : null;
  const marks = [
    ...(critical ? [{ key: 'critical', rpm: critical.speedRpm, text: `Critical ${formatValue(critical.speedRpm, 0)} rpm`, className: 'stroke-chart-warning-450', textClassName: 'text-warning-foreground-strong' }] : []),
    ...(operatingRpm === undefined ? [] : [{ key: 'operating', rpm: operatingRpm, text: `Operating ${formatValue(operatingRpm, 0)} rpm`, className: 'stroke-chart-neutral-450', textClassName: 'text-medium-foreground' }]),
  ].filter((mark) => mark.rpm >= domain[0] && mark.rpm <= domain[1]);
  const span = domain[1] - domain[0] || 1;
  const percent = (rpm: number) => ((rpm - domain[0]) / span) * 100;

  return (
    <div role="img" aria-label={label} data-slot="bode-plot" className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <PlotFrame
        label="Amplitude against speed"
        x={{ domain, ticks: [] }}
        y={{ domain: [0, top], title: `1× amplitude, ${unit}` }}
        heightClassName={heightClassName}
        gutterClassName={GUTTER}
        overlay={() =>
          marks.map((mark, index) => (
            <span
              key={mark.key}
              data-slot="bode-mark-label"
              className={cn('absolute whitespace-nowrap rounded-xs bg-base-background px-0.5 text-xs leading-none tabular-nums', index === 0 ? 'top-0' : 'top-5', mark.textClassName, percent(mark.rpm) > 70 ? '-translate-x-full pr-1.5' : 'pl-1.5')}
              style={{ left: `${percent(mark.rpm)}%` }}
            >
              {mark.text}
            </span>
          ))
        }
      >
        {(scale) => (
          <>
            {marks.map((mark) => (
              <line key={mark.key} data-slot="bode-mark" x1={scale.x(mark.rpm)} x2={scale.x(mark.rpm)} y1={0} y2={100} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" className={mark.className} />
            ))}
            <polyline data-slot="bode-amplitude" points={polylinePoints(speeds, points.map((point) => point.amplitude), scale)} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-chart-1-450" />
          </>
        )}
      </PlotFrame>
      <PlotFrame
        label="Phase lag against speed"
        x={{ domain, title: 'Shaft speed, rpm', format: (value) => formatValue(value, 0) }}
        y={{ domain: [0, 180], ticks: [0, 90, 180], title: 'Phase lag, degrees', format: (value) => `${value}°` }}
        heightClassName={heightClassName}
        gutterClassName={GUTTER}
      >
        {(scale) => (
          <>
            {marks.map((mark) => (
              <line key={mark.key} x1={scale.x(mark.rpm)} x2={scale.x(mark.rpm)} y1={0} y2={100} strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" className={mark.className} />
            ))}
            <polyline data-slot="bode-phase" points={polylinePoints(speeds, points.map((point) => point.phaseLagDeg), scale)} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="stroke-chart-2-450" />
          </>
        )}
      </PlotFrame>
    </div>
  );
}
