import { axisScale, eventLabelPosition } from './chartScale';

describe(axisScale.name, () => {
  it('pads the data and rounds to tidy ticks', () => {
    expect(axisScale([46.2, 51.4])).toEqual({ domain: [44, 52], ticks: [44, 46, 48, 50, 52] });
  });

  it('uses the explicit domain and keeps ticks inside it', () => {
    expect(axisScale([1, 2], [40, 56])).toEqual({ domain: [40, 56], ticks: [40, 45, 50, 55] });
  });

  it('uses explicit ticks when given', () => {
    expect(axisScale([], [0, 100], [0, 50, 100]).ticks).toEqual([0, 50, 100]);
  });

  it('copes with a flat series and with no data', () => {
    expect(axisScale([5, 5]).domain[0]).toBeLessThan(5);
    expect(axisScale([]).ticks.length).toBeGreaterThan(1);
  });
});

describe(eventLabelPosition.name, () => {
  it('centres the label above the line away from the edges', () => {
    expect(eventLabelPosition('Alarm raised', 50)).toBe('top');
  });

  it('tucks the label inside the plot near either edge', () => {
    expect(eventLabelPosition('Alarm raised', 97)).toBe('insideTopRight');
    expect(eventLabelPosition('Alarm raised', 3)).toBe('insideTopLeft');
  });

  it('lets short labels sit closer to the edge than long ones', () => {
    expect(eventLabelPosition('1', 97)).toBe('top');
    expect(eventLabelPosition('Work order started', 80)).toBe('insideTopRight');
  });
});
