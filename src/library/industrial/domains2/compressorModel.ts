/**
 * A small steady-state compressor model for what-if panels: shaft power and discharge temperature
 * from flow, pressures and efficiency. Ideal-gas isentropic compression with a fixed gas — enough
 * to show how the result moves with each input, not a substitute for a process simulator.
 */

export type CompressorInputs = {
  /** Standard volume flow in kSm³/h. */
  flow: number;
  /** Suction pressure in barg. */
  suctionPressure: number;
  /** Discharge pressure in barg. */
  dischargePressure: number;
  /** Isentropic efficiency in percent. */
  efficiency: number;
  /** Suction temperature in °C. */
  suctionTemperature: number;
};

export type GasProperties = {
  /** Density at standard conditions in kg/Sm³. */
  density: number;
  /** Specific heat at constant pressure in kJ/(kg·K). */
  heatCapacity: number;
  /** Ratio of specific heats. */
  heatRatio: number;
};

export type CompressorResult = {
  /** Absolute discharge pressure over absolute suction pressure. */
  pressureRatio: number;
  /** Shaft power in kW. */
  power: number;
  /** Discharge temperature in °C. */
  dischargeTemperature: number;
  /** Energy per volume compressed, in kWh/kSm³. */
  specificEnergy: number;
};

export const DEFAULT_GAS: GasProperties = { density: 0.8, heatCapacity: 2.2, heatRatio: 1.25 };

const ATMOSPHERE = 1.013;
const KELVIN = 273.15;

/** Shaft power, discharge temperature and specific energy for one operating point. */
export function compressorModel(inputs: CompressorInputs, gas: GasProperties = DEFAULT_GAS): CompressorResult {
  const flow = Math.max(0, inputs.flow);
  const efficiency = Math.min(100, Math.max(1, inputs.efficiency)) / 100;
  const suction = Math.max(0, inputs.suctionPressure) + ATMOSPHERE;
  const discharge = Math.max(suction, inputs.dischargePressure + ATMOSPHERE);
  const pressureRatio = discharge / suction;
  const suctionKelvin = inputs.suctionTemperature + KELVIN;
  const temperatureRise = (pressureRatio ** ((gas.heatRatio - 1) / gas.heatRatio) - 1) / efficiency;
  const massFlow = (flow * 1000 * gas.density) / 3600;
  const power = massFlow * gas.heatCapacity * suctionKelvin * temperatureRise;
  return {
    pressureRatio,
    power,
    dischargeTemperature: suctionKelvin * (1 + temperatureRise) - KELVIN,
    specificEnergy: flow > 0 ? power / flow : 0,
  };
}

export type SensitivityRange = { key: keyof CompressorInputs; label: string; low: number; high: number };

export type SensitivityRow = {
  key: keyof CompressorInputs;
  label: string;
  /** Output with the input at the low and at the high end of its range, everything else at base. */
  low: number;
  high: number;
};

/** One-at-a-time sensitivity of an output to each input range, for a tornado chart. */
export function compressorSensitivity(
  base: CompressorInputs,
  ranges: readonly SensitivityRange[],
  output: keyof CompressorResult = 'power',
  gas: GasProperties = DEFAULT_GAS
): SensitivityRow[] {
  return ranges.map(({ key, label, low, high }) => ({
    key,
    label,
    low: compressorModel({ ...base, [key]: low }, gas)[output],
    high: compressorModel({ ...base, [key]: high }, gas)[output],
  }));
}
