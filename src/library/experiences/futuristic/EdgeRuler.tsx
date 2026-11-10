import { cn } from '../../../lib/utils';

import { NEON_STROKE, NEON_TONE } from './neon';
import type { NeonTone } from './neon';
import { rulerTicks } from './radar';

export type EdgeRulerProps = {
  /** Which edge of the frame the ruler runs along; ticks point into the frame. */
  edge: 'top' | 'bottom' | 'left' | 'right';
  /** Number of minor divisions along the ruler. */
  divisions?: number;
  majorEvery?: number;
  tone?: NeonTone;
  className?: string;
};

const LENGTH = 1000;
const DEPTH = 10;

/**
 * A thin tick-marked ruler for the edge of a heads-up frame. Decoration that gives a display its
 * instrument feel: it stretches to the edge it sits on and is hidden from assistive technology.
 */
export function EdgeRuler({ edge, divisions = 100, majorEvery = 5, tone = 'accent', className }: EdgeRulerProps) {
  const horizontal = edge === 'top' || edge === 'bottom';
  const ticks = rulerTicks(LENGTH, LENGTH / Math.max(divisions, 1), majorEvery);
  const fromFarSide = edge === 'bottom' || edge === 'right';

  return (
    <svg
      data-slot="edge-ruler"
      data-edge={edge}
      aria-hidden="true"
      viewBox={horizontal ? `0 0 ${LENGTH} ${DEPTH}` : `0 0 ${DEPTH} ${LENGTH}`}
      preserveAspectRatio="none"
      fill="none"
      className={cn(NEON_TONE[tone], NEON_STROKE, 'block opacity-60', horizontal ? 'h-2.5 w-full' : 'h-full w-2.5', className)}
    >
      {ticks.map((tick) => {
        const size = tick.major ? DEPTH : DEPTH * 0.45;
        const start = fromFarSide ? DEPTH : 0;
        const end = fromFarSide ? DEPTH - size : size;
        return horizontal ? (
          <line key={tick.position} x1={tick.position} x2={tick.position} y1={start} y2={end} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ) : (
          <line key={tick.position} y1={tick.position} y2={tick.position} x1={start} x2={end} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        );
      })}
    </svg>
  );
}
