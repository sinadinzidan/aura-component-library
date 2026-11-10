import { blockFaces, depthScale, floorPath, gridLines, paintOrder, pointsAttribute, projectPoint } from './perspective';
import type { GridView } from './perspective';

const VIEW: GridView = { width: 800, height: 400, horizonY: 100 };

describe('depthScale', () => {
  it('is 1 at the near edge and shrinks with depth', () => {
    expect(depthScale(VIEW, 0)).toBe(1);
    expect(depthScale(VIEW, 1)).toBe(0.5);
    expect(depthScale(VIEW, 3)).toBe(0.25);
  });

  it('uses the foreshortening factor', () => {
    expect(depthScale({ ...VIEW, foreshortening: 0.5 }, 2)).toBe(0.5);
  });

  it('treats negative depth as the near edge', () => {
    expect(depthScale(VIEW, -4)).toBe(1);
  });
});

describe('projectPoint', () => {
  it('puts the near edge at the bottom, spanning the width', () => {
    expect(projectPoint(VIEW, { x: -1, z: 0 })).toEqual({ x: 0, y: 400 });
    expect(projectPoint(VIEW, { x: 1, z: 0 })).toEqual({ x: 800, y: 400 });
  });

  it('converges on the vanishing point with depth', () => {
    const point = projectPoint(VIEW, { x: 1, z: 1 });
    expect(point).toEqual({ x: 600, y: 250 });
    const far = projectPoint(VIEW, { x: 1, z: 999 });
    expect(far.x).toBeCloseTo(400, 0);
    expect(far.y).toBeCloseTo(100, 0);
  });

  it('raises a point by its height, scaled by depth', () => {
    expect(projectPoint(VIEW, { x: 0, z: 0, y: 0.25 })).toEqual({ x: 400, y: 300 });
    expect(projectPoint(VIEW, { x: 0, z: 1, y: 0.25 })).toEqual({ x: 400, y: 200 });
  });

  it('honours a custom vanishing point, floor line and floor width', () => {
    const view: GridView = { ...VIEW, vanishX: 300, floorY: 380, nearHalfWidth: 200 };
    expect(projectPoint(view, { x: 1, z: 0 })).toEqual({ x: 500, y: 380 });
  });
});

describe('gridLines', () => {
  it('returns one more line than cells in each direction', () => {
    const lines = gridLines(VIEW, { columns: 4, rows: 3, zMax: 3 });
    expect(lines.converging).toHaveLength(5);
    expect(lines.across).toHaveLength(4);
  });

  it('runs converging lines from the near edge to the far edge', () => {
    const { converging } = gridLines(VIEW, { columns: 2, rows: 1, zMax: 1 });
    expect(converging[0]).toEqual({ x1: 0, y1: 400, x2: 200, y2: 250 });
    expect(converging[1]).toEqual({ x1: 400, y1: 400, x2: 400, y2: 250 });
  });

  it('draws lines across at even depths', () => {
    const { across } = gridLines(VIEW, { columns: 2, rows: 2, zMax: 2, xMin: -2, xMax: 2 });
    expect(across[0]).toEqual({ x1: -400, y1: 400, x2: 1200, y2: 400 });
    expect(across[1].y1).toBe(250);
    expect(across[2].y1).toBe(200);
  });
});

describe('blockFaces', () => {
  it('builds a front and top face with four corners each', () => {
    const faces = blockFaces(VIEW, { x: 0, z: 1, width: 0.4, depth: 0.4, height: 0.2 });
    expect(faces.front).toHaveLength(4);
    expect(faces.top).toHaveLength(4);
    expect(faces.base).toHaveLength(4);
  });

  it('has no side face when the block straddles the vanishing point', () => {
    expect(blockFaces(VIEW, { x: 0, z: 1, width: 0.4, depth: 0.4, height: 0.2 }).side).toBeNull();
  });

  it('shows the inner side of a block right of the vanishing point', () => {
    const faces = blockFaces(VIEW, { x: 0.6, z: 1, width: 0.4, depth: 0.4, height: 0.2 });
    expect(faces.side?.[0]).toEqual(faces.front[0]);
  });

  it('shows the inner side of a block left of the vanishing point', () => {
    const faces = blockFaces(VIEW, { x: -0.6, z: 1, width: 0.4, depth: 0.4, height: 0.2 });
    expect(faces.side?.[0]).toEqual(faces.front[1]);
  });

  it('draws taller blocks higher', () => {
    const low = blockFaces(VIEW, { x: 0, z: 1, width: 0.4, depth: 0.4, height: 0.1 });
    const high = blockFaces(VIEW, { x: 0, z: 1, width: 0.4, depth: 0.4, height: 0.3 });
    expect(high.anchor.y).toBeLessThan(low.anchor.y);
  });
});

describe('pointsAttribute', () => {
  it('joins points for a polygon', () => {
    expect(pointsAttribute([{ x: 1, y: 2 }, { x: 3.5, y: 4 }])).toBe('1,2 3.5,4');
  });
});

describe('floorPath', () => {
  it('draws a path through projected floor points', () => {
    expect(floorPath(VIEW, [{ x: -1, z: 0 }, { x: 1, z: 1 }])).toBe('M 0 400 L 600 250');
  });

  it('is empty without points', () => {
    expect(floorPath(VIEW, [])).toBe('');
  });
});

describe('paintOrder', () => {
  it('sorts far blocks first without changing the input', () => {
    const blocks = [{ id: 'a', z: 0.5 }, { id: 'b', z: 2 }, { id: 'c', z: 1 }];
    expect(paintOrder(blocks).map((block) => block.id)).toEqual(['b', 'c', 'a']);
    expect(blocks[0].id).toBe('a');
  });
});
