/**
 * A five-step temperature ramp built from chart tokens, warm to cold. The same keys colour ground
 * rings in a 3D scene (resolve `TEMPERATURE_RAMP_TOKENS` with `useTokenColors`) and DOM legends
 * (`TEMPERATURE_RAMP_VARS`), so scene and legend can never disagree.
 */
export const TEMPERATURE_RAMP_KEYS = ['step0', 'step1', 'step2', 'step3', 'step4'] as const;

export type TemperatureRampKey = (typeof TEMPERATURE_RAMP_KEYS)[number];

/** Token names without the leading `--`, warm (step0) to cold (step4). */
export const TEMPERATURE_RAMP_TOKENS = {
  step0: 'chart-warning-450',
  step1: 'chart-warning-300',
  step2: 'chart-neutral-300',
  step3: 'chart-info-300',
  step4: 'chart-info-450',
} as const;

/** The same ramp as CSS values for `style` props and gradients. */
export const TEMPERATURE_RAMP_VARS: Record<TemperatureRampKey, string> = {
  step0: 'var(--chart-warning-450)',
  step1: 'var(--chart-warning-300)',
  step2: 'var(--chart-neutral-300)',
  step3: 'var(--chart-info-300)',
  step4: 'var(--chart-info-450)',
};

/** The two ends of a temperature scale, in the same unit. `warm` is above `cold`. */
export type TemperatureScale = { warm: number; cold: number };

/** Where a temperature sits on the scale: 0 at the warm end, 1 at the cold end, clamped. */
export function temperatureFraction(temperature: number, scale: TemperatureScale): number {
  const span = scale.warm - scale.cold;
  if (span <= 0 || !Number.isFinite(temperature)) return 0;
  return Math.min(1, Math.max(0, (scale.warm - temperature) / span));
}

/** The temperature at a fraction of the scale: the inverse of `temperatureFraction`. */
export function temperatureAt(fraction: number, scale: TemperatureScale): number {
  return scale.warm - Math.min(1, Math.max(0, fraction)) * (scale.warm - scale.cold);
}

/** Index of the ramp step a temperature falls in: 0 (warmest) to `steps − 1` (coldest). */
export function temperatureStep(temperature: number, scale: TemperatureScale, steps: number = TEMPERATURE_RAMP_KEYS.length): number {
  if (steps <= 1) return 0;
  return Math.min(steps - 1, Math.floor(temperatureFraction(temperature, scale) * steps));
}

/** The ramp key a temperature falls in. */
export function temperatureRampKey(temperature: number, scale: TemperatureScale): TemperatureRampKey {
  return TEMPERATURE_RAMP_KEYS[temperatureStep(temperature, scale)] ?? 'step0';
}

export type TemperatureBand = { key: TemperatureRampKey; from: number; to: number };

/** The temperature range each ramp step covers, warm to cold, for a legend. */
export function temperatureBands(scale: TemperatureScale): TemperatureBand[] {
  const count = TEMPERATURE_RAMP_KEYS.length;
  return TEMPERATURE_RAMP_KEYS.map((key, index) => ({
    key,
    from: temperatureAt(index / count, scale),
    to: temperatureAt((index + 1) / count, scale),
  }));
}

/** A CSS gradient through the ramp, warm first. `direction` is a CSS gradient direction such as `to bottom`. */
export function temperatureGradient(direction = 'to bottom'): string {
  return `linear-gradient(${direction}, ${TEMPERATURE_RAMP_KEYS.map((key) => TEMPERATURE_RAMP_VARS[key]).join(', ')})`;
}

/** A temperature in words: "−162 °C", with a real minus sign. */
export function formatTemperature(temperature: number, decimals = 0): string {
  const rounded = Math.abs(temperature).toFixed(decimals);
  const isZero = Number(rounded) === 0;
  return `${temperature < 0 && !isZero ? '−' : ''}${rounded} °C`;
}
