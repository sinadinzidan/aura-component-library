import { cn } from '../../../lib/utils';
import type { Tone } from '../status';

import { circlePath } from './diagramGeometry';
import { SYMBOL_TONE_TEXT, symbolFrame } from './symbolState';
import type { SymbolSize } from './symbolState';

export type InstrumentBubbleProps = {
  /** ISA function letters: PT, TT, FT, LT, PIC … */
  letters: string;
  /** Loop number printed under the letters, such as 92531. */
  loop?: string;
  /** `panel` adds the centre line of a control-room mounted instrument. */
  mounting?: 'field' | 'panel';
  /** Accessible name. Defaults to the letters and loop number. */
  label?: string;
  /** `sm` 32, `md` 40, `lg` 48 in HTML; a number is diagram units inside a `DiagramCanvas`. */
  size?: SymbolSize | number;
  /** Centre in the parent diagram. Leave out when the bubble stands alone. */
  cx?: number;
  cy?: number;
  tone?: Tone;
  className?: string;
};

const GRID = 32;
const SIZE_CLASS: Record<SymbolSize, string> = { sm: 'size-8', md: 'size-10', lg: 'size-12' };

/**
 * An ISA instrument bubble: function letters over a loop number. Use it to mark where a
 * measurement is taken; put the live value beside it in a `ValueTag`.
 */
export function InstrumentBubble({ letters, loop, mounting = 'field', label, size = 'md', cx, cy, tone = 'neutral', className }: InstrumentBubbleProps) {
  const { className: sizeClass, ...frame } = symbolFrame(size, cx, cy, SIZE_CLASS);

  return (
    <svg
      role="img"
      aria-label={label ?? (loop ? `${letters} ${loop}` : letters)}
      data-slot="instrument-bubble"
      data-tone={tone}
      viewBox={`0 0 ${GRID} ${GRID}`}
      overflow="visible"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={cn('shrink-0', sizeClass, SYMBOL_TONE_TEXT[tone], className)}
      {...frame}
    >
      <path d={circlePath(16, 16, 14)} vectorEffect="non-scaling-stroke" />
      {mounting === 'panel' ? <path data-slot="instrument-panel-line" d="M 2 16 H 30" vectorEffect="non-scaling-stroke" /> : null}
      <text x={16} y={loop ? 11.5 : 16} fontSize={loop ? 9 : 11} textAnchor="middle" dominantBaseline="central" stroke="none" fill="currentColor" className="font-medium">
        {letters}
      </text>
      {loop ? (
        <text x={16} y={21.5} fontSize={7} textAnchor="middle" dominantBaseline="central" stroke="none" fill="currentColor" className="tabular-nums">
          {loop}
        </text>
      ) : null}
    </svg>
  );
}
