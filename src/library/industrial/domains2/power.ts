import type { StatusDescriptor, Tone } from '../status';

/** What a wind turbine is doing right now. */
export type TurbineState = 'generating' | 'idle' | 'curtailed' | 'stopped' | 'fault' | 'maintenance';

const TURBINE_STATUS: Record<TurbineState, StatusDescriptor> = {
  generating: { tone: 'success', label: 'Generating', shape: 'dot' },
  idle: { tone: 'neutral', label: 'Idle, low wind', shape: 'ring' },
  curtailed: { tone: 'info', label: 'Curtailed', shape: 'ring' },
  stopped: { tone: 'neutral', label: 'Stopped', shape: 'square' },
  fault: { tone: 'critical', label: 'Fault', shape: 'diamond' },
  maintenance: { tone: 'warning', label: 'Maintenance', shape: 'square' },
};

/** Tone, label and shape of a turbine state: spread it into `StatusIndicator`. */
export const turbineStatus = (state: TurbineState): StatusDescriptor => TURBINE_STATUS[state];

/** Energy produced as a share of what the rated power would give over the period, in percent. */
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
export function batteryRuntime(
  chargePercent: number,
  capacityMwh: number,
  powerMw: number,
  { reservePercent = 0, fullPercent = 100, deadband = 0.05 }: { reservePercent?: number; fullPercent?: number; deadband?: number } = {}
): BatteryRuntime {
  if (Math.abs(powerMw) <= deadband || !(capacityMwh > 0)) return { mode: 'idle', hours: null };
  if (powerMw > 0) {
    const room = (Math.max(0, fullPercent - chargePercent) / 100) * capacityMwh;
    return { mode: 'charging', hours: room / powerMw };
  }
  const usable = (Math.max(0, chargePercent - reservePercent) / 100) * capacityMwh;
  return { mode: 'discharging', hours: usable / -powerMw };
}

/** "2 h 40 min", "45 min", "3 h". Rounded to the minute. */
export function formatHours(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const whole = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (whole === 0) return `${minutes} min`;
  return minutes === 0 ? `${whole} h` : `${whole} h ${minutes} min`;
}

/** Status of a grid frequency: neutral inside the normal band, warning outside it, critical outside the alert band. */
export function frequencyTone(frequency: number, nominal: number, normalBand: number, alertBand: number): Tone {
  const deviation = Math.abs(frequency - nominal);
  if (deviation > alertBand) return 'critical';
  if (deviation > normalBand) return 'warning';
  return 'neutral';
}
