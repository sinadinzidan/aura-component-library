import { cn } from '../../../lib/utils';
import type { Tone } from '../status';

import { arrowPositions, polylinePath, reverseDirection } from './diagramGeometry';
import type { Point } from './diagramGeometry';
import { FlowArrow } from './FlowArrow';
import { SYMBOL_TONE_TEXT } from './symbolState';

export type PipeWeight = 'light' | 'normal' | 'heavy';

export type PipeLineProps = {
  /** Route in diagram units. Keep segments horizontal or vertical. */
  points: readonly Point[];
  /** `heavy` for main process lines and energised busbars, `light` for utilities and signals. */
  weight?: PipeWeight;
  /** Dashed line: no flow, de-energised, or an instrument signal. */
  dashed?: boolean;
  /** Draws arrowheads along the route. `reverse` flows from the last point to the first. */
  flow?: 'forward' | 'reverse';
  /** Number of arrowheads when `flow` is set. */
  arrows?: number;
  arrowSize?: number;
  tone?: Tone;
  className?: string;
};

const WIDTH: Record<PipeWeight, number> = { light: 1, normal: 1.5, heavy: 3 };
const DASH: Record<PipeWeight, string> = { light: '3 3', normal: '5 4', heavy: '7 5' };

/**
 * A pipe or conductor between two symbols, with optional flow arrows. Line weight carries
 * meaning (main versus utility, energised versus dead), so the state survives without colour.
 * Draw it inside a `DiagramCanvas`.
 */
export function PipeLine({ points, weight = 'normal', dashed = false, flow, arrows = 1, arrowSize = 8, tone = 'neutral', className }: PipeLineProps) {
  const positions = flow ? arrowPositions(points, arrows) : [];

  return (
    <g data-slot="pipe-line" data-weight={weight} data-flow={flow} className={cn(SYMBOL_TONE_TEXT[tone], className)}>
      <path
        d={polylinePath(points)}
        fill="none"
        stroke="currentColor"
        strokeWidth={WIDTH[weight]}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? DASH[weight] : undefined}
        vectorEffect="non-scaling-stroke"
      />
      {positions.map((position) => (
        <FlowArrow
          key={`${position.point.x}-${position.point.y}`}
          x={position.point.x}
          y={position.point.y}
          direction={flow === 'reverse' ? reverseDirection(position.direction) : position.direction}
          size={arrowSize}
          tone={tone}
        />
      ))}
    </g>
  );
}
