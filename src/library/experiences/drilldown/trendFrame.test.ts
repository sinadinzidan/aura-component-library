import { trendFrame } from './trendFrame';

describe(trendFrame.name, () => {
  const reading = { limits: { low: 90, high: 145, highHigh: 155 }, decimals: 1, rangeMin: 0 };

  it('draws the limits the value is close to and leaves the far one out', () => {
    const frame = trendFrame(138, 143, reading);

    expect(frame.lines.map((line) => line.label)).toEqual(['High 145', 'Trip 155']);
    expect(frame.top).toBeGreaterThan(155);
    expect(frame.bottom).toBeGreaterThan(120);
    expect(frame.bottom).toBeLessThan(138);
  });

  it('draws the low limit when the value is near the bottom of its band', () => {
    const frame = trendFrame(92, 96, reading);

    expect(frame.lines.map((line) => line.label)).toEqual(['Low 90']);
    expect(frame.bottom).toBeLessThan(90);
  });

  it('ignores a low limit at the start of the range and never goes below the range', () => {
    const frame = trendFrame(0, 0.4, { limits: { low: 0, high: 7.1, highHigh: 11 }, decimals: 1, rangeMin: 0 });

    expect(frame.lines).toEqual([]);
    expect(frame.bottom).toBe(0);
  });

  it('puts the high and trip labels on opposite ends so they cannot collide', () => {
    const frame = trendFrame(138, 143, reading);

    expect(frame.lines.map((line) => line.align)).toEqual(['left', 'right']);
  });
});
