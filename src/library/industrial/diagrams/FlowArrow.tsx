import { cn } from '../../../lib/utils';
import type { Tone } from '../status';

import { arrowHeadPath } from './diagramGeometry';
import type { Direction } from './diagramGeometry';
import { SYMBOL_TONE_TEXT } from './symbolState';

export type FlowArrowProps = {
  /** Centre of the arrowhead in diagram units. */
  x: number;
  y: number;
  direction?: Direction;
  /** Length of the arrowhead in diagram units. */
  size?: number;
  tone?: Tone;
  className?: string;
};

/**
 * A solid arrowhead that shows which way a line flows. A static mark: direction is stated once,
 * not animated. Draw it inside a `DiagramCanvas`; `PipeLine` places its own.
 */
export function FlowArrow({ x, y, direction = 'right', size = 8, tone = 'neutral', className }: FlowArrowProps) {
  return (
    <path
      data-slot="flow-arrow"
      data-direction={direction}
      d={arrowHeadPath({ x, y }, direction, size)}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinejoin="round"
      className={cn(SYMBOL_TONE_TEXT[tone], className)}
    />
  );
}
