import { totalLoss, waterfallDomain, waterfallSteps } from './waterfallSteps';

const INPUT = {
  start: { label: 'Plan', value: 54 },
  losses: [
    { id: 'trips', label: 'Compressor trips', value: 1.2 },
    { id: 'fouling', label: 'Cooler fouling', value: 0.8 },
    { id: 'planned', label: 'Planned work', value: 0.5 },
  ],
  endLabel: 'Actual',
};

describe('waterfallSteps', () => {
  it('starts with the full total from zero', () => {
    expect(waterfallSteps(INPUT)[0]).toEqual({ id: 'start', label: 'Plan', kind: 'start', value: 54, from: 0, to: 54, share: 1 });
  });

  it('hangs each loss from the level the previous one left', () => {
    const [, trips, fouling, planned] = waterfallSteps(INPUT);
    expect(trips).toMatchObject({ kind: 'loss', value: 1.2, from: 52.8, to: 54 });
    expect(fouling).toMatchObject({ from: 52, to: 52.8 });
    expect(planned).toMatchObject({ from: 51.5, to: 52 });
  });

  it('ends with what is left', () => {
    const steps = waterfallSteps(INPUT);
    expect(steps[steps.length - 1]).toMatchObject({ id: 'end', label: 'Actual', kind: 'end', value: 51.5, from: 0, to: 51.5 });
  });

  it('reports each step as a share of the start', () => {
    const steps = waterfallSteps({ start: { label: 'Plan', value: 100 }, losses: [{ id: 'a', label: 'A', value: 25 }], endLabel: 'Actual' });
    expect(steps.map((step) => step.share)).toEqual([1, 0.25, 0.75]);
  });

  it('treats a negative loss as none and survives a zero start', () => {
    const steps = waterfallSteps({ start: { label: 'Plan', value: 0 }, losses: [{ id: 'a', label: 'A', value: -3 }], endLabel: 'Actual' });
    expect(steps.map((step) => step.value)).toEqual([0, 0, 0]);
    expect(steps.every((step) => step.share === 0)).toBe(true);
  });

  it('uses the ids it is given', () => {
    const steps = waterfallSteps({ ...INPUT, start: { id: 'plan', label: 'Plan', value: 54 }, endId: 'actual' });
    expect(steps[0].id).toBe('plan');
    expect(steps[steps.length - 1].id).toBe('actual');
  });
});

describe('totalLoss', () => {
  it('sums the loss steps only', () => {
    expect(totalLoss(waterfallSteps(INPUT))).toBe(2.5);
  });
});

describe('waterfallDomain', () => {
  it('lifts the floor when losses are a small part of the start', () => {
    expect(waterfallDomain(waterfallSteps(INPUT), 5)).toEqual([50, 54]);
  });

  it('keeps zero when the losses are large', () => {
    const steps = waterfallSteps({ start: { label: 'Plan', value: 10 }, losses: [{ id: 'a', label: 'A', value: 6 }], endLabel: 'Actual' });
    expect(waterfallDomain(steps)).toEqual([0, 10]);
  });

  it('never goes below zero', () => {
    const steps = waterfallSteps({ start: { label: 'Plan', value: 10 }, losses: [{ id: 'a', label: 'A', value: 3 }], endLabel: 'Actual' });
    expect(waterfallDomain(steps, 20)[0]).toBe(0);
  });
});
