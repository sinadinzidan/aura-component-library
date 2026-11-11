/**
 * Scale arithmetic for cockpit-style tape instruments: a window of the scale slides past a fixed
 * pointer, so every tick is placed by its distance from the current value.
 */

export type TapeTick = {
  value: number;
  /** Distance from the pointer as a share of the half window: −1 at the bottom edge, 1 at the top. */
  offset: number;
  /** Major ticks carry a number. */
  major: boolean;
};

const tidy = (value: number): number => Number(value.toFixed(6));

/** Ticks visible in a window of `span` either side of `value`, one every `step`, every `majorEvery`-th major. */
export function tapeTicks(value: number, span: number, step: number, majorEvery = 2): TapeTick[] {
  const first = Math.ceil(tidy((value - span) / step));
  const last = Math.floor(tidy((value + span) / step));
  const ticks: TapeTick[] = [];
  for (let index = first; index <= last; index += 1) {
    const tick = tidy(index * step);
    ticks.push({ value: tick, offset: tidy((tick - value) / span), major: index % majorEvery === 0 });
  }
  return ticks;
}

/** Position of a scale value in the window as a percentage from the top, clamped to the window. */
export function tapePosition(target: number, value: number, span: number): number {
  return tidy(Math.min(100, Math.max(0, 50 - ((target - value) / span) * 50)));
}

/** Signed deviation of a value from its reference, in percent of the reference. */
export function deviationPercent(value: number, reference: number): number {
  return tidy(((value - reference) / (reference || 1)) * 100);
}
