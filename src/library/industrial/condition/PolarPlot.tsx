import { cn } from '../../../lib/utils';
import { DiagramCanvas } from '../diagrams/DiagramCanvas';
import { formatValue } from '../status';

import { niceCeiling } from './plotScale';
import { polarPoint } from './rotor';
import type { RotorResponse } from './rotor';

export type PolarPlotProps = {
  /** What the plot shows. Becomes the accessible name. */
  label: string;
  /** 1× amplitude and phase at each speed of a run-up or coast-down, in order. */
  points: readonly RotorResponse[];
  unit: string;
  /** Speeds to print beside the curve. */
  labelSpeeds?: readonly number[];
  /** Radius of the plot. Defaults to a round value above the largest amplitude. */
  range?: number;
  /** Diagram size in pixels at full scale. */
  size?: number;
  className?: string;
};

const SPOKES = [0, 90, 180, 270] as const;

/**
 * A polar (Nyquist) plot of a run-up: the same data as a Bode plot, with amplitude as radius and
 * phase lag as angle. A resonance draws a loop — the critical speed is at the far side of it —
 * which makes it easier to tell a true critical from a structural resonance.
 */
export function PolarPlot({ label, points, unit, labelSpeeds = [], range, size = 220, className }: PolarPlotProps) {
  const reach = range ?? niceCeiling(Math.max(0, ...points.map((point) => point.amplitude)), 1.1);
  const padding = 30;
  const centre = size / 2;
  const radius = centre - padding;
  // Phase lag grows against the direction of rotation: drawn clockwise from 0° at the right.
  const place = (amplitude: number, phaseLagDeg: number) => {
    const point = polarPoint(amplitude, phaseLagDeg);
    return { x: centre + (point.x / reach) * radius, y: centre + (point.y / reach) * radius };
  };
  const path = points
    .map((point, index) => {
      const at = place(point.amplitude, point.phaseLagDeg);
      return `${index === 0 ? 'M' : 'L'} ${at.x.toFixed(1)} ${at.y.toFixed(1)}`;
    })
    .join(' ');
  const labelled = labelSpeeds.flatMap((speed) => {
    const nearest = points.reduce<RotorResponse | null>((best, point) => (!best || Math.abs(point.speedRpm - speed) < Math.abs(best.speedRpm - speed) ? point : best), null);
    return nearest ? [{ speed, ...place(nearest.amplitude, nearest.phaseLagDeg) }] : [];
  });

  return (
    <DiagramCanvas label={label} width={size} height={size} className={cn('text-medium-foreground', className)}>
      {[0.5, 1].map((fraction) => (
        <circle key={fraction} cx={centre} cy={centre} r={radius * fraction} strokeWidth={1} className="stroke-chart-neutral-200" />
      ))}
      {SPOKES.map((angle) => {
        const end = place(reach, angle);
        const text = place(reach * 1.13, angle);
        return (
          <g key={angle}>
            <line x1={centre} y1={centre} x2={end.x} y2={end.y} strokeWidth={1} className="stroke-chart-neutral-200" />
            <text x={text.x} y={text.y + 3.5} fontSize={10} textAnchor="middle" className="fill-muted-foreground tabular-nums">
              {angle}°
            </text>
          </g>
        );
      })}
      <path data-slot="polar-path" d={path} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" className="stroke-chart-1-450" />
      {labelled.map((item) => (
        <g key={item.speed} data-slot="polar-speed">
          <circle cx={item.x} cy={item.y} r={2.5} className="fill-base-foreground" />
          <text x={item.x + 6} y={item.y - 5} fontSize={10} className="fill-base-foreground tabular-nums">
            {formatValue(item.speed, 0)}
          </text>
        </g>
      ))}
      <text x={centre + radius * 0.5 + 3} y={centre + 12} fontSize={10} className="fill-muted-foreground tabular-nums">
        {formatValue(reach / 2, reach < 10 ? 1 : 0)}
      </text>
      <text x={size - 4} y={size - 6} fontSize={10} textAnchor="end" className="fill-muted-foreground tabular-nums">
        Full scale {formatValue(reach, reach < 10 ? 1 : 0)} {unit}; speeds in rpm
      </text>
    </DiagramCanvas>
  );
}
