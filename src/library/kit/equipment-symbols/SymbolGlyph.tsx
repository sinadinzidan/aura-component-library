import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import { SYMBOLS, SYMBOL_GRID, VALVE_FAULT_MARK, type SymbolKind } from './symbols';

export type SymbolFill = 'none' | 'soft' | 'solid';

/** How heavy each look draws a symbol, in px at any size. */
const LOOK_STROKE: Record<LookId, number> = {
  studio: 1.75,
  console: 1.75,
  poster: 2.5,
  glass: 1.75,
  editorial: 1.25,
  soft: 2.25,
  blueprint: 1.25,
  signal: 2.25,
};

/** Body fill a look gives a symbol that has a state but no explicit fill. */
const LOOK_FILL: Record<LookId, SymbolFill> = {
  studio: 'soft',
  console: 'solid',
  poster: 'solid',
  glass: 'soft',
  editorial: 'none',
  soft: 'soft',
  blueprint: 'none',
  signal: 'none',
};

type SymbolGlyphProps = {
  kind: SymbolKind;
  /** Accessible name; defaults to the name of the symbol. Pass `null` when text beside it already names it. */
  label?: string | null;
  /** Side length in px. */
  size?: number;
  /** Colour of the symbol: its state. `neutral` draws it in ink. */
  tone?: Tone;
  /** How the body is filled. Leave out to let the look choose: tinted in studio, solid in console and poster, never on a blueprint. */
  fill?: SymbolFill;
  /** A dashed outline: out of service, isolated or not yet installed. */
  dashed?: boolean;
  /** A small cross beside the symbol: failed to reach position, or faulted. */
  fault?: boolean;
  /** Letters inside an instrument bubble or machine, replacing the default. */
  text?: string;
  className?: string;
};

/**
 * One symbol from the set, drawn on its 24-unit grid with a stroke that keeps its weight at any
 * size. The look sets the weight and whether a state fills the body; the tone carries the state.
 */
export function SymbolGlyph({ kind, label, size = 40, tone = 'neutral', fill, dashed = false, fault = false, text, className }: SymbolGlyphProps) {
  const look = useLook();
  const definition = SYMBOLS[kind];
  const mode = fill ?? (tone === 'neutral' ? 'none' : LOOK_FILL[look]);
  const ink = tone === 'neutral' ? 'var(--kit-text)' : 'var(--t-line)';
  const bodyFill = mode === 'solid' ? 'var(--t-line)' : mode === 'soft' ? 'color-mix(in oklab, var(--t-line) 22%, transparent)' : 'none';
  const name = label === undefined ? definition.label : label;

  return (
    <svg
      role={name === null ? undefined : 'img'}
      aria-label={name ?? undefined}
      aria-hidden={name === null ? true : undefined}
      data-look={look}
      data-tone={tone}
      data-kind={kind}
      data-fill={mode}
      viewBox={`0 0 ${SYMBOL_GRID} ${SYMBOL_GRID}`}
      width={size}
      height={size}
      overflow="visible"
      fill="none"
      stroke={ink}
      strokeWidth={LOOK_STROKE[look]}
      strokeLinecap={look === 'poster' || look === 'blueprint' ? 'square' : 'round'}
      strokeLinejoin={look === 'poster' || look === 'blueprint' ? 'miter' : 'round'}
      className={cx('shrink-0', className)}
      style={look === 'glass' && tone !== 'neutral' ? { filter: 'drop-shadow(0 0 5px var(--t-line))' } : undefined}
    >
      {definition.shapes.map((shape) => (
        <path
          key={shape.d}
          d={shape.d}
          data-role={shape.role}
          vectorEffect="non-scaling-stroke"
          fill={shape.role === 'line' ? 'none' : shape.role === 'solid' ? ink : bodyFill}
          stroke={mode === 'solid' && shape.role === 'line' && tone !== 'neutral' ? 'var(--kit-text)' : undefined}
          strokeDasharray={shape.dashed || (dashed && shape.role === 'body') ? '3 2.5' : undefined}
        />
      ))}
      {(text ? [{ value: text, x: 12, y: 12, size: text.length > 2 ? 6 : 8 }] : (definition.texts ?? [])).map((entry) => (
        <text key={entry.value} x={entry.x} y={entry.y} fontSize={entry.size} fontWeight={600} textAnchor="middle" dominantBaseline="central" stroke="none" fill={mode === 'solid' && tone !== 'neutral' ? 'var(--kit-halo)' : ink}>
          {entry.value}
        </text>
      ))}
      {fault ? <path d={VALVE_FAULT_MARK} data-part="fault" vectorEffect="non-scaling-stroke" stroke="var(--kit-line-critical)" strokeWidth={LOOK_STROKE[look] + 0.5} /> : null}
    </svg>
  );
}
