import { cellsToPixels, deltaToCells, gridMetrics, spanToPixels } from './gridMetrics';

describe(gridMetrics.name, () => {
  it('splits the width into columns with gaps between them', () => {
    expect(gridMetrics(1184, 12, 64, 16)).toEqual({ colWidth: 84, rowHeight: 64, gap: 16 });
  });

  it('gives a zero width instead of a negative one when the grid is too narrow', () => {
    expect(gridMetrics(100, 12, 64, 16).colWidth).toBe(0);
  });

  it('gives a zero width for a grid with no columns', () => {
    expect(gridMetrics(600, 0, 64, 16).colWidth).toBe(0);
  });
});

describe(deltaToCells.name, () => {
  const metrics = gridMetrics(1184, 12, 64, 16);

  it('stays on the cell for travel under half a step', () => {
    expect(deltaToCells(49, 39, metrics)).toEqual({ cols: 0, rows: 0 });
  });

  it('snaps to the next cell past half a step', () => {
    expect(deltaToCells(51, 41, metrics)).toEqual({ cols: 1, rows: 1 });
  });

  it('snaps backwards for negative travel', () => {
    expect(deltaToCells(-210, -90, metrics)).toEqual({ cols: -2, rows: -1 });
  });

  it('reports zero, not negative zero, for small negative travel', () => {
    const result = deltaToCells(-3, -3, metrics);

    expect(Object.is(result.cols, 0)).toBe(true);
    expect(Object.is(result.rows, 0)).toBe(true);
  });

  it('reports no movement when the grid has not been measured', () => {
    expect(deltaToCells(500, 500, { colWidth: 0, rowHeight: 0, gap: 0 })).toEqual({ cols: 0, rows: 0 });
  });
});

describe(cellsToPixels.name, () => {
  it('includes the gaps crossed', () => {
    expect(cellsToPixels(2, 3, gridMetrics(1184, 12, 64, 16))).toEqual({ x: 200, y: 240 });
  });
});

describe(spanToPixels.name, () => {
  it('counts the gaps inside the span but not around it', () => {
    expect(spanToPixels(4, 3, gridMetrics(1184, 12, 64, 16))).toEqual({ width: 384, height: 224 });
  });

  it('is never negative', () => {
    expect(spanToPixels(0, 0, gridMetrics(1184, 12, 64, 16))).toEqual({ width: 0, height: 0 });
  });
});
