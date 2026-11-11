import { cn } from '../../../lib/utils';
import { DiagramCanvas } from '../diagrams/DiagramCanvas';
import { formatValue } from '../status';

import type { PlotPoint } from './rotor';

export type CentrelineSample = PlotPoint & {
  /** Printed beside the point when set: a speed such as "3 000". */
  label?: string;
};

export type ShaftCentrelinePlotProps = {
  /** What the plot shows. Becomes the accessible name. */
  label: string;
  /** Average journal positions from standstill to running speed, in order. */
  samples: readonly CentrelineSample[];
  /** Radial bearing clearance, in the unit of the samples; drawn as the outer circle. */
  clearance: number;
  unit: string;
  /** Diagram size in pixels at full scale. */
  size?: number;
  className?: string;
};

/**
 * A shaft centreline plot: where the journal sits inside the bearing clearance as the machine
 * runs up. It starts at the bottom and climbs with the oil wedge; a position near the wall or a
 * path that leaves the lower quadrant points to wiped babbitt, misalignment or preload.
 */
export function ShaftCentrelinePlot({ label, samples, clearance, unit, size = 220, className }: ShaftCentrelinePlotProps) {
  const padding = 22;
  const centre = size / 2;
  const radius = centre - padding;
  const toX = (value: number) => centre + (value / clearance) * radius;
  const toY = (value: number) => centre - (value / clearance) * radius;
  const last = samples[samples.length - 1];
  const path = samples.map((sample, index) => `${index === 0 ? 'M' : 'L'} ${toX(sample.x).toFixed(1)} ${toY(sample.y).toFixed(1)}`).join(' ');

  return (
    <DiagramCanvas label={label} width={size} height={size} className={cn('text-medium-foreground', className)}>
      <circle data-slot="centreline-clearance" cx={centre} cy={centre} r={radius} strokeWidth={1.25} className="stroke-chart-neutral-450" />
      <circle cx={centre} cy={centre} r={radius * 0.5} strokeWidth={1} strokeDasharray="2 3" className="stroke-chart-neutral-300" />
      <line x1={padding} x2={size - padding} y1={centre} y2={centre} strokeWidth={1} className="stroke-chart-neutral-200" />
      <line x1={centre} x2={centre} y1={padding} y2={size - padding} strokeWidth={1} className="stroke-chart-neutral-200" />
      <path data-slot="centreline-path" d={path} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" className="stroke-chart-1-450" />
      {samples.map((sample, index) =>
        sample.label ? (
          <g key={`${sample.label}-${index}`} data-slot="centreline-sample">
            <circle cx={toX(sample.x)} cy={toY(sample.y)} r={index === samples.length - 1 ? 3.5 : 2.5} className={index === samples.length - 1 ? 'fill-base-foreground' : 'fill-chart-1-450'} />
            <text x={toX(sample.x) + 7} y={toY(sample.y) + 3.5} fontSize={10} className={cn('tabular-nums', index === samples.length - 1 ? 'fill-base-foreground font-medium' : 'fill-muted-foreground')}>
              {sample.label}
            </text>
          </g>
        ) : null
      )}
      <text x={centre} y={padding - 8} fontSize={10} textAnchor="middle" className="fill-muted-foreground">
        Clearance {formatValue(clearance, 0)} {unit}
      </text>
      {last ? (
        <text x={centre} y={size - 6} fontSize={10} textAnchor="middle" className="fill-muted-foreground tabular-nums">
          Eccentricity ratio {formatValue(Math.hypot(last.x, last.y) / clearance, 2)}
        </text>
      ) : null}
    </DiagramCanvas>
  );
}
