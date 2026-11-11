import { approach, tetherPoints } from './tether';

describe(tetherPoints.name, () => {
  it('runs from one end to the other', () => {
    const points = tetherPoints([0, 10, 0], [20, 0, 0], 2, 5);

    expect(points).toHaveLength(5);
    expect(points[0]).toEqual([0, 10, 0]);
    expect(points[4][0]).toBeCloseTo(20, 9);
    expect(points[4][1]).toBeCloseTo(0, 9);
  });

  it('sags below the straight line in the middle', () => {
    const points = tetherPoints([0, 10, 0], [20, 10, 0], 3, 5);

    expect(points[2][1]).toBeCloseTo(7, 9);
  });

  it('is straight without sag and has at least two points', () => {
    expect(tetherPoints([0, 0, 0], [4, 0, 0], 0, 0).map((point) => point[0])).toEqual([0, 4]);
  });
});

describe(approach.name, () => {
  it('moves a fraction of the way', () => {
    expect(approach([0, 0, 0], [10, 0, 0], 0.5).position).toEqual([5, 0, 0]);
  });

  it('snaps to the goal once close enough', () => {
    expect(approach([9.99, 0, 0], [10, 0, 0], 0.1)).toEqual({ position: [10, 0, 0], arrived: true });
  });

  it('jumps straight to the goal for a fraction of one or more', () => {
    expect(approach([0, 0, 0], [3, 4, 0], 5)).toEqual({ position: [3, 4, 0], arrived: true });
  });

  it('does not move for a zero fraction', () => {
    expect(approach([0, 0, 0], [3, 4, 0], 0)).toEqual({ position: [0, 0, 0], arrived: false });
  });
});
