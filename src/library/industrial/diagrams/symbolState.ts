import { TONE_TEXT } from '../status';
import type { RunState, StatusDescriptor, Tone } from '../status';

/**
 * How states are drawn on symbols. The rule follows high-performance HMI practice: equipment is
 * grey, fill says running or closed, and colour appears only when something is abnormal.
 */

/** How strongly a symbol body is filled with its own stroke colour. */
export type SymbolFill = 'none' | 'soft' | 'solid' | 'full';

export const SYMBOL_FILL_OPACITY: Record<SymbolFill, number> = { none: 0, soft: 0.12, solid: 0.35, full: 1 };

/** Stroke colour of a symbol: neutral equipment is mid grey, not the text colour. */
export const SYMBOL_TONE_TEXT: Record<Tone, string> = {
  ...TONE_TEXT,
  neutral: 'text-medium-foreground',
};

export type SymbolAppearance = { tone: Tone; fill: SymbolFill; dashed: boolean };

const RUN_STATE_APPEARANCE: Record<RunState, SymbolAppearance> = {
  running: { tone: 'neutral', fill: 'solid', dashed: false },
  standby: { tone: 'neutral', fill: 'soft', dashed: false },
  stopped: { tone: 'neutral', fill: 'none', dashed: false },
  tripped: { tone: 'critical', fill: 'none', dashed: false },
  maintenance: { tone: 'warning', fill: 'none', dashed: true },
};

/** Running is filled, standby lightly filled, stopped hollow; tripped and maintenance take colour. */
export const runStateAppearance = (state: RunState): SymbolAppearance => RUN_STATE_APPEARANCE[state];

export type ValvePosition = 'open' | 'closed' | 'travelling' | 'failed';

const VALVE_POSITION_STATUS: Record<ValvePosition, StatusDescriptor> = {
  open: { tone: 'neutral', label: 'Open', shape: 'ring' },
  closed: { tone: 'neutral', label: 'Closed', shape: 'dot' },
  travelling: { tone: 'info', label: 'Travelling', shape: 'ring' },
  failed: { tone: 'critical', label: 'Failed', shape: 'diamond' },
};

/** Open is hollow and closed is solid, in the symbol and in the dot beside its label. */
export const valvePositionStatus = (position: ValvePosition): StatusDescriptor => VALVE_POSITION_STATUS[position];

export type BreakerState = 'closed' | 'open' | 'tripped';

const BREAKER_STATUS: Record<BreakerState, StatusDescriptor> = {
  closed: { tone: 'neutral', label: 'Closed', shape: 'square' },
  open: { tone: 'neutral', label: 'Open', shape: 'ring' },
  tripped: { tone: 'critical', label: 'Tripped', shape: 'diamond' },
};

/** A closed breaker is a solid square, an open one hollow; only a trip takes colour. */
export const breakerStatus = (state: BreakerState): StatusDescriptor => BREAKER_STATUS[state];

export type SymbolSize = 'sm' | 'md' | 'lg';

/** Standalone sizes on the 24 / 32 / 48 grid, as spacing utilities so they follow the theme density. */
export const SYMBOL_SIZE_CLASS: Record<SymbolSize, string> = { sm: 'size-6', md: 'size-8', lg: 'size-12' };

export type SymbolFrame = { className?: string; x?: number; y?: number; width?: number; height?: number };

/**
 * Sizing for a symbol's own `<svg>`: a named size becomes a utility class for use in HTML; a
 * number is diagram units, centred on (cx, cy) when the symbol is nested in a diagram.
 */
export function symbolFrame(
  size: SymbolSize | number,
  cx?: number,
  cy?: number,
  sizeClass: Record<SymbolSize, string> = SYMBOL_SIZE_CLASS
): SymbolFrame {
  if (typeof size !== 'number') return { className: sizeClass[size] };
  const frame: SymbolFrame = { width: size, height: size };
  if (cx !== undefined && cy !== undefined) {
    frame.x = cx - size / 2;
    frame.y = cy - size / 2;
  }
  return frame;
}
