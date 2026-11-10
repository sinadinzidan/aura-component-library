import { DEFAULT_GAS, compressorModel, compressorSensitivity } from './compressorModel';
import type { CompressorInputs } from './compressorModel';

const BASE: CompressorInputs = { flow: 182.4, suctionPressure: 12.4, dischargePressure: 48.6, efficiency: 78, suctionTemperature: 28 };

describe(compressorModel.name, () => {
  it('computes the pressure ratio from absolute pressures', () => {
    expect(compressorModel(BASE).pressureRatio).toBeCloseTo(49.613 / 13.413, 6);
  });

  it('gives a plausible power and discharge temperature for the base case', () => {
    const result = compressorModel(BASE);

    expect(result.power).toBeGreaterThan(10_000);
    expect(result.power).toBeLessThan(10_600);
    expect(result.dischargeTemperature).toBeGreaterThan(140);
    expect(result.dischargeTemperature).toBeLessThan(146);
  });

  it('scales power linearly with flow', () => {
    const half = compressorModel({ ...BASE, flow: BASE.flow / 2 });

    expect(half.power).toBeCloseTo(compressorModel(BASE).power / 2, 6);
    expect(half.specificEnergy).toBeCloseTo(compressorModel(BASE).specificEnergy, 6);
  });

  it('needs more power and runs hotter at a higher pressure ratio', () => {
    const higher = compressorModel({ ...BASE, dischargePressure: 52 });

    expect(higher.power).toBeGreaterThan(compressorModel(BASE).power);
    expect(higher.dischargeTemperature).toBeGreaterThan(compressorModel(BASE).dischargeTemperature);
  });

  it('needs less power and runs cooler at a higher efficiency', () => {
    const better = compressorModel({ ...BASE, efficiency: 82 });

    expect(better.power).toBeLessThan(compressorModel(BASE).power);
    expect(better.dischargeTemperature).toBeLessThan(compressorModel(BASE).dischargeTemperature);
  });

  it('does no work when discharge is not above suction', () => {
    const result = compressorModel({ ...BASE, dischargePressure: 5 });

    expect(result.pressureRatio).toBe(1);
    expect(result.power).toBe(0);
    expect(result.dischargeTemperature).toBeCloseTo(BASE.suctionTemperature, 6);
  });

  it('is zero at zero flow', () => {
    const result = compressorModel({ ...BASE, flow: 0 });

    expect(result.power).toBe(0);
    expect(result.specificEnergy).toBe(0);
  });

  it('clamps a nonsensical efficiency instead of dividing by zero', () => {
    expect(Number.isFinite(compressorModel({ ...BASE, efficiency: 0 }).power)).toBe(true);
    expect(compressorModel({ ...BASE, efficiency: 140 }).power).toBeCloseTo(compressorModel({ ...BASE, efficiency: 100 }).power, 6);
  });

  it('uses the gas it is given', () => {
    const heavier = compressorModel(BASE, { ...DEFAULT_GAS, density: 0.9 });

    expect(heavier.power).toBeCloseTo((compressorModel(BASE).power * 0.9) / 0.8, 6);
  });
});

describe(compressorSensitivity.name, () => {
  it('varies one input at a time and keeps the order of the ranges', () => {
    const rows = compressorSensitivity(BASE, [
      { key: 'flow', label: 'Flow', low: 160, high: 200 },
      { key: 'efficiency', label: 'Efficiency', low: 74, high: 82 },
    ]);

    expect(rows.map((row) => row.key)).toEqual(['flow', 'efficiency']);
    expect(rows[0].low).toBeCloseTo(compressorModel({ ...BASE, flow: 160 }).power, 6);
    expect(rows[0].high).toBeCloseTo(compressorModel({ ...BASE, flow: 200 }).power, 6);
  });

  it('reports a falling output for an input that helps', () => {
    const [row] = compressorSensitivity(BASE, [{ key: 'efficiency', label: 'Efficiency', low: 74, high: 82 }]);

    expect(row.high).toBeLessThan(row.low);
  });

  it('can report another output', () => {
    const [row] = compressorSensitivity(BASE, [{ key: 'suctionTemperature', label: 'Suction temperature', low: 20, high: 36 }], 'dischargeTemperature');

    expect(row.high - row.low).toBeGreaterThan(16);
  });
});
