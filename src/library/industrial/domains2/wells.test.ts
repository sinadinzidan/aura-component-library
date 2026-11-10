import { gasOilRatio, voidageReplacement, waterCut, wellStatus } from './wells';

describe(wellStatus.name, () => {
  it.each([
    ['producing', 'Producing', 'success'],
    ['shut-in', 'Shut in', 'neutral'],
    ['injecting', 'Injecting', 'info'],
    ['workover', 'Workover', 'warning'],
  ] as const)('describes %s', (state, label, tone) => {
    expect(wellStatus(state)).toMatchObject({ label, tone });
  });

  it('gives every state its own shape', () => {
    const shapes = (['producing', 'shut-in', 'injecting', 'workover'] as const).map((state) => wellStatus(state).shape);

    expect(new Set(shapes).size).toBe(4);
  });
});

describe(waterCut.name, () => {
  it('is water over total liquid in percent', () => {
    expect(waterCut(600, 400)).toBe(40);
  });

  it('is zero for a dry oil well', () => {
    expect(waterCut(500, 0)).toBe(0);
  });

  it('is null without liquid', () => {
    expect(waterCut(0, 0)).toBeNull();
  });
});

describe(gasOilRatio.name, () => {
  it('divides gas by oil', () => {
    expect(gasOilRatio(120000, 800)).toBe(150);
  });

  it('is null without oil', () => {
    expect(gasOilRatio(120000, 0)).toBeNull();
  });
});

describe(voidageReplacement.name, () => {
  it('is injected over produced', () => {
    expect(voidageReplacement(9500, 10000)).toBe(0.95);
  });

  it('is null without production', () => {
    expect(voidageReplacement(100, 0)).toBeNull();
  });
});
