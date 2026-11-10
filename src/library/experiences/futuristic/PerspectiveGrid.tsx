import { useId } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { NEON_STROKE, NEON_TONE } from './neon';
import type { NeonTone } from './neon';
import { depthScale, gridLines } from './perspective';
import type { GridView } from './perspective';

export type PerspectiveGridProps = {
  /** Projection shared with everything drawn on the floor (`GridBlock`, `floorPath`). */
  view: GridView;
  /** What the scene shows, for assistive technology. */
  label: string;
  /** Cells across and in depth. */
  columns?: number;
  rows?: number;
  /** Floor extent. The grid may be wider than the view so it bleeds off both sides. */
  xMin?: number;
  xMax?: number;
  zMax?: number;
  tone?: NeonTone;
  /** SVG content drawn on the floor, in the same user units as `view`. */
  children?: ReactNode;
  className?: string;
};

/**
 * A neon floor grid receding to a glowing horizon, as inline SVG. It is a stage: pass blocks and
 * connector lines as children and project them with the same `view`. Lines fade with depth so the
 * far field stays quiet behind whatever stands on it.
 */
export function PerspectiveGrid({
  view,
  label,
  columns = 16,
  rows = 10,
  xMin = -2,
  xMax = 2,
  zMax = 6,
  tone = 'accent',
  children,
  className,
}: PerspectiveGridProps) {
  const glowId = useId();
  const { converging, across } = gridLines(view, { columns, rows, xMin, xMax, zMax });

  return (
    <svg
      data-slot="perspective-grid"
      role="group"
      aria-label={label}
      viewBox={`0 0 ${view.width} ${view.height}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn(NEON_TONE[tone], 'block size-full', className)}
    >
      <defs>
        <linearGradient id={glowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--neon)', stopOpacity: 0 }} />
          <stop offset="1" style={{ stopColor: 'var(--neon)', stopOpacity: 0.28 }} />
        </linearGradient>
      </defs>

      <rect data-slot="horizon-glow" x={0} y={view.horizonY - 70} width={view.width} height={70} fill={`url(#${glowId})`} />

      <g aria-hidden="true" fill="none" strokeWidth={1} className={NEON_STROKE}>
        {converging.map((line, index) => (
          <line key={`c${index}`} data-slot="grid-line" {...line} opacity={0.3} />
        ))}
        {across.map((line, index) => (
          <line
            key={`a${index}`}
            data-slot="grid-line"
            {...line}
            opacity={0.12 + 0.4 * depthScale(view, (zMax * index) / Math.max(rows, 1))}
          />
        ))}
        <line
          data-slot="horizon"
          x1={0}
          x2={view.width}
          y1={view.horizonY}
          y2={view.horizonY}
          strokeWidth={1.5}
          className="[filter:drop-shadow(0_0_6px_var(--neon))]"
        />
      </g>

      {children}
    </svg>
  );
}
