import { cn } from '../../../lib/utils';
import { DiagramCanvas } from '../diagrams/DiagramCanvas';
import { formatValue } from '../status';

import { niceCeiling } from './plotScale';
import { orbitRadius } from './rotor';
import type { PlotPoint } from './rotor';

export type OrbitPlotProps = {
  /** What the orbit shows. Becomes the accessible name. */
  label: string;
  /** Shaft centre positions from the X and Y probes. The first point is at the keyphasor pulse. */
  points: readonly PlotPoint[];
  /** Unit of the positions, e.g. "µm". */
  unit: string;
  /** Radius of the plot. Defaults to a round value above the largest excursion. */
  range?: number;
  /** A circle at this radius, e.g. the alert amplitude or the bearing clearance. */
  limit?: { radius: number; label: string };
  /** A second, quieter orbit behind the first: a baseline or the 1× filtered orbit. */
  reference?: readonly PlotPoint[];
  /** Direction of shaft rotation, drawn as an arrow in the corner. */
  rotation?: 'cw' | 'ccw';
  /** Diagram size in pixels at full scale. */
  size?: number;
  className?: string;
};

const pathOf = (points: readonly PlotPoint[], toX: (value: number) => number, toY: (value: number) => number): string =>
  points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${toX(point.x).toFixed(1)} ${toY(point.y).toFixed(1)}`).join(' ');

/**
 * An orbit: the path of the shaft centre inside its bearing, from two proximity probes 90° apart.
 * The dot is the keyphasor — where the shaft was at the once-per-turn pulse — and the gap after
 * it shows which way the shaft precesses. Shape tells the fault: a flat ellipse is preload, a
 * figure of eight is misalignment, an inner loop is a rub or whirl.
 */
export function OrbitPlot({ label, points, unit, range, limit, reference, rotation = 'ccw', size = 220, className }: OrbitPlotProps) {
  const reach = range ?? niceCeiling(Math.max(orbitRadius(points), reference ? orbitRadius(reference) : 0, limit?.radius ?? 0), 1.1);
  const padding = 22;
  const centre = size / 2;
  const radius = centre - padding;
  const toX = (value: number) => centre + (value / reach) * radius;
  const toY = (value: number) => centre - (value / reach) * radius;
  const keyphasor = points[0];
  // Leave a gap after the keyphasor dot, so the direction of travel can be read.
  const traced = points.slice(Math.min(points.length - 1, Math.max(1, Math.round(points.length * 0.04))));

  return (
    <DiagramCanvas label={label} width={size} height={size} className={cn('text-medium-foreground', className)}>
      {[0.5, 1].map((fraction) => (
        <circle key={fraction} cx={centre} cy={centre} r={radius * fraction} strokeWidth={1} className="stroke-chart-neutral-200" />
      ))}
      <line x1={padding} x2={size - padding} y1={centre} y2={centre} strokeWidth={1} className="stroke-chart-neutral-200" />
      <line x1={centre} x2={centre} y1={padding} y2={size - padding} strokeWidth={1} className="stroke-chart-neutral-200" />
      {limit ? (
        <>
          <circle data-slot="orbit-limit" cx={centre} cy={centre} r={(limit.radius / reach) * radius} strokeWidth={1.25} strokeDasharray="5 3" className="stroke-chart-warning-450" />
          <text x={centre + 4} y={centre - (limit.radius / reach) * radius - 4} fontSize={10} className="fill-warning-foreground-strong">
            {limit.label}
          </text>
        </>
      ) : null}
      {reference ? <path data-slot="orbit-reference" d={pathOf(reference, toX, toY)} strokeWidth={1.25} strokeLinejoin="round" className="stroke-chart-neutral-300" /> : null}
      <path data-slot="orbit-path" d={pathOf(traced, toX, toY)} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" className="stroke-chart-1-450" />
      {keyphasor ? <circle data-slot="orbit-keyphasor" cx={toX(keyphasor.x)} cy={toY(keyphasor.y)} r={3.5} className="fill-base-foreground" /> : null}
      <text x={size - padding + 4} y={centre + 3.5} fontSize={10} className="fill-muted-foreground">
        X
      </text>
      <text x={centre} y={padding - 8} fontSize={10} textAnchor="middle" className="fill-muted-foreground">
        Y
      </text>
      <text x={centre + radius * 0.5 + 3} y={centre + 12} fontSize={10} className="fill-muted-foreground tabular-nums">
        {formatValue(reach / 2, reach < 10 ? 1 : 0)}
      </text>
      <text x={size - padding} y={size - 6} fontSize={10} textAnchor="end" className="fill-muted-foreground tabular-nums">
        Full scale {formatValue(reach, reach < 10 ? 1 : 0)} {unit}
      </text>
      <g data-slot="orbit-rotation" transform={`translate(${padding - 8} ${size - 22})`} className="stroke-chart-neutral-450">
        <path d={rotation === 'ccw' ? 'M 14 8 A 7 7 0 1 0 7 15' : 'M 0 8 A 7 7 0 1 1 7 15'} strokeWidth={1.25} strokeLinecap="round" />
        <path d={rotation === 'ccw' ? 'M 11 5 L 14 8.5 L 17 5' : 'M 3 5 L 0 8.5 L -3 5'} strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </DiagramCanvas>
  );
}
