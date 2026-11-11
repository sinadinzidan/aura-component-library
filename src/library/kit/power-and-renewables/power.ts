import type { Tone } from '../tones';

/** Pure questions about generation, storage and the grid. */

/** What a wind turbine is doing right now. */
export type TurbineState = 'generating' | 'idle' | 'curtailed' | 'stopped' | 'fault' | 'maintenance';

export const TURBINE_TONE: Record<TurbineState, Tone> = { generating: 'success', idle: 'neutral', curtailed: 'info', stopped: 'neutral', fault: 'critical', maintenance: 'warning' };

export const TURBINE_WORD: Record<TurbineState, string> = { generating: 'Generating', idle: 'Idle', curtailed: 'Curtailed', stopped: 'Stopped', fault: 'Fault', maintenance: 'Maintenance' };

/** Energy produced as a share of what the rated power would give over the period, in per cent. */
export function capacityFactor(energyMwh: number, ratedMw: number, hours: number): number | null {
  if (!(ratedMw > 0) || !(hours > 0)) return null;
  return (energyMwh / (ratedMw * hours)) * 100;
}

export type PowerCurvePoint = { windSpeed: number; power: number };

/** Warranted power at a wind speed, linearly interpolated on the curve. Zero outside the curve. */
export function warrantedPower(windSpeed: number, curve: readonly PowerCurvePoint[]): number {
  const first = curve[0];
  const last = curve[curve.length - 1];
  if (!first || !last || windSpeed < first.windSpeed || windSpeed > last.windSpeed) return 0;
  const upperIndex = curve.findIndex((point) => point.windSpeed >= windSpeed);
  const upper = curve[upperIndex];
  const lower = curve[Math.max(0, upperIndex - 1)];
  if (upper.windSpeed === lower.windSpeed) return upper.power;
  const fraction = (windSpeed - lower.windSpeed) / (upper.windSpeed - lower.windSpeed);
  return lower.power + fraction * (upper.power - lower.power);
}

/** True when a measured point sits further under the warranted curve than the tolerance allows. */
export function isUnderperforming(point: PowerCurvePoint, curve: readonly PowerCurvePoint[], tolerance = 0.15): boolean {
  const expected = warrantedPower(point.windSpeed, curve);
  return expected > 0 && point.power < expected * (1 - tolerance);
}

export type BatteryMode = 'charging' | 'discharging' | 'idle';

export type BatteryRuntime = {
  mode: BatteryMode;
  /** Hours until full (charging) or until the reserve is reached (discharging). `null` when idle. */
  hours: number | null;
};

/**
 * What a battery is doing and for how long it can keep doing it. Positive power charges, negative
 * discharges; power within `deadband` of zero counts as idle.
 */
export function batteryRuntime(chargePercent: number, capacityMwh: number, powerMw: number, { reservePercent = 0, deadband = 0.05 }: { reservePercent?: number; deadband?: number } = {}): BatteryRuntime {
  if (Math.abs(powerMw) <= deadband || !(capacityMwh > 0)) return { mode: 'idle', hours: null };
  if (powerMw > 0) return { mode: 'charging', hours: ((Math.max(0, 100 - chargePercent) / 100) * capacityMwh) / powerMw };
  return { mode: 'discharging', hours: ((Math.max(0, chargePercent - reservePercent) / 100) * capacityMwh) / -powerMw };
}

/** "2 h 40 min", "45 min", "3 h". Rounded to the minute. */
export function formatHours(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const whole = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (whole === 0) return `${minutes} min`;
  return minutes === 0 ? `${whole} h` : `${whole} h ${minutes} min`;
}

export type FrequencyState = { tone: Tone; word: string };

/** State of a grid frequency: normal inside the normal band, a warning outside it, an alert outside the alert band. */
export function frequencyState(frequency: number, nominal: number, normalBand: number, alertBand: number): FrequencyState {
  const deviation = Math.abs(frequency - nominal);
  if (deviation > alertBand) return { tone: 'critical', word: 'Alert' };
  if (deviation > normalBand) return { tone: 'warning', word: 'Outside normal band' };
  return { tone: 'success', word: 'Normal' };
}

/** Point on a circle, with zero degrees at north and angles growing clockwise, as on a compass. */
export function compassPoint(cx: number, cy: number, radius: number, degrees: number): [number, number] {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)];
}

/** Path of a wedge from the centre, `spread` degrees wide and centred on `degrees`. */
export function wedgePath(cx: number, cy: number, radius: number, degrees: number, spread: number): string {
  const [x1, y1] = compassPoint(cx, cy, radius, degrees - spread / 2);
  const [x2, y2] = compassPoint(cx, cy, radius, degrees + spread / 2);
  const round = (value: number) => Math.round(value * 100) / 100;
  return `M ${cx} ${cy} L ${round(x1)} ${round(y1)} A ${radius} ${radius} 0 0 1 ${round(x2)} ${round(y2)} Z`;
}
