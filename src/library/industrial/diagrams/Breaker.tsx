import { cn } from '../../../lib/utils';

import { SYMBOL_GRID } from './symbolPaths';
import { SYMBOL_TONE_TEXT, breakerStatus, symbolFrame } from './symbolState';
import type { BreakerState, SymbolSize } from './symbolState';

export type BreakerProps = {
  state: BreakerState;
  /** Tag or name. The state is appended to the accessible name. */
  label?: string;
  /** `vertical` sits in a feeder that drops from a bus; `horizontal` sits in a bus tie. */
  orientation?: 'vertical' | 'horizontal';
  /** `sm` 24, `md` 32, `lg` 48 in HTML; a number is diagram units inside a `DiagramCanvas`. */
  size?: SymbolSize | number;
  /** Centre in the parent diagram. Leave out when the breaker stands alone. */
  cx?: number;
  cy?: number;
  className?: string;
};

const SQUARE = 'M 7 7 H 17 V 17 H 7 Z';
const STUBS = 'M 12 2 V 7 M 12 17 V 22';
const CROSS = 'M 9.5 9.5 L 14.5 14.5 M 14.5 9.5 L 9.5 14.5';

/**
 * A circuit breaker for single-line diagrams. Closed is a solid square, open a hollow one, and
 * a trip a hollow square with a cross in the critical tone — shape first, colour second.
 */
export function Breaker({ state, label, orientation = 'vertical', size = 'md', cx, cy, className }: BreakerProps) {
  const status = breakerStatus(state);
  const { className: sizeClass, ...frame } = symbolFrame(size, cx, cy);

  return (
    <svg
      role="img"
      aria-label={`${label ?? 'Breaker'}, ${status.label.toLowerCase()}`}
      data-slot="breaker"
      data-state={state}
      viewBox={`0 0 ${SYMBOL_GRID} ${SYMBOL_GRID}`}
      overflow="visible"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', sizeClass, SYMBOL_TONE_TEXT[status.tone], className)}
      {...frame}
    >
      <g transform={orientation === 'horizontal' ? 'rotate(90 12 12)' : undefined}>
        <path d={STUBS} vectorEffect="non-scaling-stroke" />
        <path data-slot="breaker-contact" d={SQUARE} vectorEffect="non-scaling-stroke" fill={state === 'closed' ? 'currentColor' : 'none'} />
        {state === 'tripped' ? <path data-slot="breaker-trip" d={CROSS} vectorEffect="non-scaling-stroke" /> : null}
      </g>
    </svg>
  );
}
