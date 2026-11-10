import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import type { Tone } from '../status';

import { SYMBOLS, SYMBOL_GRID } from './symbolPaths';
import type { SymbolKind } from './symbolPaths';
import { SYMBOL_FILL_OPACITY, SYMBOL_TONE_TEXT, symbolFrame } from './symbolState';
import type { SymbolFill, SymbolSize } from './symbolState';

export type EquipmentSymbolProps = {
  kind: SymbolKind;
  /** Accessible name. Defaults to the symbol's own name; pass the tag and state on a diagram. */
  label?: string;
  /** `sm` 24, `md` 32, `lg` 48 when used in HTML; a number is diagram units inside a `DiagramCanvas`. */
  size?: SymbolSize | number;
  /** Centre in the parent diagram. Leave out when the symbol stands alone. */
  cx?: number;
  cy?: number;
  /** Stroke colour. Keep neutral unless the equipment is in an abnormal state. */
  tone?: Tone;
  /** How strongly the body is filled: running equipment is filled, stopped equipment hollow. */
  fill?: SymbolFill;
  /** Dashed body outline, for equipment that is isolated or out of service. */
  dashed?: boolean;
  /** Extra marks on the symbol's 24-unit grid. */
  children?: ReactNode;
  className?: string;
};

const DASH = '3 2.5';

/**
 * One glyph from the equipment symbol set, drawn from `symbolPaths.ts`. Strokes use
 * `currentColor` and never scale, so a symbol is as crisp at 48 as at 24. Works on its own in
 * HTML, or nested in a `DiagramCanvas` when given `cx`, `cy` and a numeric `size`.
 */
export function EquipmentSymbol({ kind, label, size = 'md', cx, cy, tone = 'neutral', fill = 'none', dashed = false, children, className }: EquipmentSymbolProps) {
  const definition = SYMBOLS[kind];
  const { className: sizeClass, ...frame } = symbolFrame(size, cx, cy);

  return (
    <svg
      role="img"
      aria-label={label ?? definition.label}
      data-slot="equipment-symbol"
      data-kind={kind}
      data-tone={tone}
      data-fill={fill}
      viewBox={`0 0 ${SYMBOL_GRID} ${SYMBOL_GRID}`}
      overflow="visible"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', sizeClass, SYMBOL_TONE_TEXT[tone], className)}
      {...frame}
    >
      {definition.shapes.map((shape) => (
        <path
          key={shape.d}
          d={shape.d}
          data-role={shape.role}
          vectorEffect="non-scaling-stroke"
          fill={shape.role === 'line' ? 'none' : 'currentColor'}
          fillOpacity={shape.role === 'body' ? SYMBOL_FILL_OPACITY[fill] : undefined}
          strokeDasharray={shape.dashed || (dashed && shape.role === 'body') ? DASH : undefined}
        />
      ))}
      {definition.texts?.map((text) => (
        <text
          key={text.value}
          x={text.x}
          y={text.y}
          fontSize={text.size}
          textAnchor="middle"
          dominantBaseline="central"
          stroke="none"
          fill="currentColor"
          className="font-medium"
        >
          {text.value}
        </text>
      ))}
      {children}
    </svg>
  );
}
