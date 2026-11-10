import type { Tone, Zone } from '../../industrial/status';

/**
 * Pure scale maths for a moving tape indicator. The pointer is fixed at the middle of the tape
 * and the scale slides under it, so every position is an offset from the current value:
 * 0 at the pointer, −0.5 at the low end of the window and +0.5 at the high end.
 */

export type TapeTick = { value: number; offset: number; major: boolean };

export type TapeBand = { from: number; to: number; tone: Tone };

export type TapeBug = { offset: number; pinned: 'low' | 'high' | null };

export type TapeTickOptions = {
  /** Value under the pointer. */
  value: number;
  /** Width of the visible window, in value units. */
  span: number;
  /** Distance between numbered ticks. */
  majorStep: number;
  /** Minor divisions per major step. */
  minorPerMajor?: number;
  /** Ends of the scale; nothing is drawn beyond them. */
  min?: number;
  max?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function tidy(value: number): number {
  return Number(value.toFixed(6));
}

/** Offset of a scale mark from the pointer, in window fractions. Unclamped. */
export function tapeOffset(mark: number, value: number, span: number): number {
  if (!(span > 0)) return 0;
  return tidy((mark - value) / span);
}

/** The ticks inside the window around `value`, lowest first. */
export function tapeTicks({ value, span, majorStep, minorPerMajor = 5, min = -Infinity, max = Infinity }: TapeTickOptions): TapeTick[] {
  if (!(span > 0) || !(majorStep > 0) || !Number.isFinite(value)) return [];
  const divisions = Math.max(1, Math.round(minorPerMajor));
  const step = majorStep / divisions;
  const low = Math.max(value - span / 2, min);
  const high = Math.min(value + span / 2, max);
  const ticks: TapeTick[] = [];
  for (let index = Math.ceil(tidy(low / step)); index <= Math.floor(tidy(high / step)); index += 1) {
    const mark = tidy(index * step);
    ticks.push({ value: mark, offset: tapeOffset(mark, value, span), major: index % divisions === 0 });
  }
  return ticks;
}

/** The parts of the status zones that fall inside the window, as clamped offsets. */
export function tapeBands(zones: readonly Zone[], value: number, span: number): TapeBand[] {
  return zones
    .map((zone) => ({
      from: clamp(tapeOffset(zone.from, value, span), -0.5, 0.5),
      to: clamp(tapeOffset(zone.to, value, span), -0.5, 0.5),
      tone: zone.tone,
    }))
    .filter((band) => band.to > band.from);
}

/** Where the setpoint bug sits. Outside the window it is pinned to the nearest end. */
export function tapeBug(setpoint: number, value: number, span: number): TapeBug {
  const offset = tapeOffset(setpoint, value, span);
  if (offset > 0.5) return { offset: 0.5, pinned: 'high' };
  if (offset < -0.5) return { offset: -0.5, pinned: 'low' };
  return { offset, pinned: null };
}
