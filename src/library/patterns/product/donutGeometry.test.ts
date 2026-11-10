import { donutArcs, formatShare } from './donutGeometry';

describe(donutArcs.name, () => {
  it('splits the circumference by share, in order', () => {
    const arcs = donutArcs([50, 30, 20], 100);

    expect(arcs.map((arc) => arc.length)).toEqual([50, 30, 20]);
    expect(arcs.map((arc) => arc.offset)).toEqual([0, 50, 80]);
    expect(arcs.map((arc) => arc.share)).toEqual([0.5, 0.3, 0.2]);
  });

  it('leaves a gap between neighbouring arcs without moving their starts', () => {
    const arcs = donutArcs([50, 50], 100, 2);

    expect(arcs.map((arc) => arc.length)).toEqual([48, 48]);
    expect(arcs.map((arc) => arc.offset)).toEqual([0, 50]);
  });

  it('draws a single value as a closed ring', () => {
    expect(donutArcs([7, 0], 100, 2)[0]).toEqual({ length: 100, offset: 0, share: 1 });
  });

  it('gives empty arcs to values that cannot be drawn', () => {
    const arcs = donutArcs([10, 0, -4, Number.NaN, 10], 100);

    expect(arcs.map((arc) => arc.length)).toEqual([50, 0, 0, 0, 50]);
    expect(arcs[4].offset).toBe(50);
  });

  it('returns empty arcs when everything is zero', () => {
    expect(donutArcs([0, 0], 100, 2)).toEqual([
      { length: 0, offset: 0, share: 0 },
      { length: 0, offset: 0, share: 0 },
    ]);
  });

  it('never returns a negative length for a sliver smaller than the gap', () => {
    expect(donutArcs([1, 999], 100, 2)[0].length).toBe(0);
  });
});

describe(formatShare.name, () => {
  it('rounds to whole percent', () => {
    expect(formatShare(0.426)).toBe('43%');
  });

  it('keeps a small share visible', () => {
    expect(formatShare(0.004)).toBe('<1%');
  });

  it('shows zero for nothing', () => {
    expect(formatShare(0)).toBe('0%');
    expect(formatShare(Number.NaN)).toBe('0%');
  });
});
