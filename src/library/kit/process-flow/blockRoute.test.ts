import { BLOCK_METRICS, arrowHead, blockBox, metricsFor, routeBetween, routePath } from './blockRoute';

const METRICS = { cellWidth: 100, cellHeight: 100, blockWidth: 60, blockHeight: 40 };

describe('blockRoute', () => {
  it('centres a block in its cell', () => {
    expect(blockBox({ id: 'a', col: 1, row: 0 }, METRICS)).toEqual({ x: 120, y: 30, width: 60, height: 40 });
  });

  it('runs straight between neighbours in a row', () => {
    const route = routeBetween({ id: 'a', col: 0, row: 0 }, { id: 'b', col: 1, row: 0 }, METRICS);

    expect(route.points).toEqual([
      [80, 50],
      [120, 50],
    ]);
    expect(route.heading).toEqual([1, 0]);
  });

  it('steps down to a block in a lower row', () => {
    const route = routeBetween({ id: 'a', col: 0, row: 0 }, { id: 'b', col: 1, row: 1 }, METRICS);

    expect(route.points).toHaveLength(4);
    expect(route.points[3]).toEqual([120, 150]);
  });

  it('joins blocks in one column top to bottom', () => {
    const route = routeBetween({ id: 'a', col: 0, row: 0 }, { id: 'b', col: 0, row: 1 }, METRICS);

    expect(route.heading).toEqual([0, 1]);
  });

  it('loops a recycle over the top and enters from above', () => {
    const route = routeBetween({ id: 'a', col: 2, row: 0 }, { id: 'b', col: 0, row: 0 }, METRICS);

    expect(route.points[1][1]).toBeLessThan(30);
    expect(route.heading).toEqual([0, 1]);
    expect(route.label.y).toBe(route.points[1][1]);
  });

  it('writes a path and an arrow head', () => {
    expect(routePath([[0, 0], [10, 0]])).toBe('M 0 0 L 10 0');
    expect(arrowHead([10, 0], [1, 0], 5)).toMatch(/^M 10 0 L 3 /);
  });

  it('fits the cells to the width and falls back when it is unknown', () => {
    expect(metricsFor(900, 6).cellWidth).toBe(150);
    expect(metricsFor(900, 6).blockWidth).toBe(110);
    expect(metricsFor(0, 6)).toBe(BLOCK_METRICS);
  });
});
