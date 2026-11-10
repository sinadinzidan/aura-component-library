import { FULL_CIRCLE, arcCentroid, arcLength, arcLinePath, arcPath, easeInOut, fitsInArc, isLowerHalf, partition, polar, ringRadii, shapeArcs, tweenArcs } from './sunburstLayout';

type Tree = { id: string; weight?: number; children?: Tree[] };

const TREE: Tree = {
  id: 'root',
  children: [
    { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }] },
    { id: 'b', children: [{ id: 'b1' }] },
  ],
};

const accessors = { id: (node: Tree) => node.id, children: (node: Tree) => node.children ?? [] };
const byId = <T extends { id: string }>(arcs: readonly T[], id: string): T | undefined => arcs.find((arc) => arc.id === id);

describe(partition.name, () => {
  it('gives the root the full circle at depth 0', () => {
    expect(partition(TREE, accessors)[0]).toEqual({ id: 'root', parentId: null, depth: 0, start: 0, end: FULL_CIRCLE });
  });

  it('shares the angle by number of leaves', () => {
    const arcs = partition(TREE, accessors);

    expect(byId(arcs, 'a')).toMatchObject({ depth: 1, start: 0 });
    expect(byId(arcs, 'a')?.end).toBeCloseTo(FULL_CIRCLE * 0.75);
    expect(byId(arcs, 'b')?.start).toBeCloseTo(FULL_CIRCLE * 0.75);
    expect(byId(arcs, 'b')?.end).toBeCloseTo(FULL_CIRCLE);
  });

  it('nests children inside their parent, in order', () => {
    const arcs = partition(TREE, accessors);
    const parent = byId(arcs, 'a');
    const kids = arcs.filter((arc) => arc.parentId === 'a');

    expect(kids.map((arc) => arc.id)).toEqual(['a1', 'a2', 'a3']);
    expect(kids[0]?.start).toBeCloseTo(parent?.start ?? -1);
    expect(kids[2]?.end).toBeCloseTo(parent?.end ?? -1);
    expect(kids[1]?.start).toBeCloseTo(kids[0]?.end ?? -1);
    expect(kids.every((arc) => arc.depth === 2)).toBe(true);
  });

  it('uses leaf weights when given', () => {
    const arcs = partition(
      { id: 'root', children: [{ id: 'x', weight: 3 }, { id: 'y', weight: 1 }] },
      { ...accessors, weight: (node: Tree) => node.weight ?? 1 }
    );

    expect(byId(arcs, 'x')?.end).toBeCloseTo(FULL_CIRCLE * 0.75);
  });

  it('splits evenly when every weight is zero', () => {
    const arcs = partition({ id: 'root', children: [{ id: 'x' }, { id: 'y' }] }, { ...accessors, weight: () => 0 });

    expect(byId(arcs, 'x')?.end).toBeCloseTo(Math.PI);
  });

  it('stops at the deepest ring asked for', () => {
    const arcs = partition(TREE, { ...accessors, maxDepth: 1 });

    expect(arcs.map((arc) => arc.id)).toEqual(['root', 'a', 'b']);
  });

  it('re-roots on a subtree', () => {
    const arcs = partition(TREE.children?.[0] ?? TREE, accessors);

    expect(arcs.map((arc) => [arc.id, arc.depth])).toEqual([
      ['a', 0],
      ['a1', 1],
      ['a2', 1],
      ['a3', 1],
    ]);
    expect(byId(arcs, 'a2')?.start).toBeCloseTo(FULL_CIRCLE / 3);
  });
});

describe(ringRadii.name, () => {
  const options = { inner: 80, outer: 200, rings: 3 };

  it('makes the root the centre disc', () => {
    expect(ringRadii(0, options)).toEqual({ r0: 0, r1: 80 });
  });

  it('divides the space between the disc and the rim into equal rings', () => {
    expect(ringRadii(1, options)).toEqual({ r0: 80, r1: 120 });
    expect(ringRadii(3, options)).toEqual({ r0: 160, r1: 200 });
  });

  it('widens the rings when fewer are shown', () => {
    expect(ringRadii(1, { ...options, rings: 1 })).toEqual({ r0: 80, r1: 200 });
  });

  it('leaves a gap on the inside of each ring', () => {
    expect(ringRadii(2, { ...options, gap: 2 })).toEqual({ r0: 122, r1: 160 });
  });
});

describe(polar.name, () => {
  it('starts at twelve o’clock and runs clockwise', () => {
    expect(polar(100, 100, 50, 0)).toEqual({ x: 100, y: 50 });
    expect(polar(100, 100, 50, Math.PI / 2).x).toBeCloseTo(150);
    expect(polar(100, 100, 50, Math.PI / 2).y).toBeCloseTo(100);
    expect(polar(100, 100, 50, Math.PI).y).toBeCloseTo(150);
  });
});

describe(arcPath.name, () => {
  it('draws an annular sector with an outer and an inner arc', () => {
    expect(arcPath(100, 100, 50, 80, 0, Math.PI / 2)).toBe('M 100 20 A 80 80 0 0 1 180 100 L 150 100 A 50 50 0 0 0 100 50 Z');
  });

  it('sets the large-arc flag past half a turn', () => {
    expect(arcPath(100, 100, 50, 80, 0, Math.PI * 1.5)).toContain('A 80 80 0 1 1');
  });

  it('draws a pie slice from the centre without an inner radius', () => {
    expect(arcPath(100, 100, 0, 80, 0, Math.PI / 2)).toBe('M 100 100 L 100 20 A 80 80 0 0 1 180 100 Z');
  });

  it('draws a full ring as two halves', () => {
    const path = arcPath(100, 100, 50, 80, 0, FULL_CIRCLE);

    expect(path.match(/M /g)).toHaveLength(2);
    expect(path.match(/Z/g)).toHaveLength(2);
  });

  it('returns an empty path for an empty arc', () => {
    expect(arcPath(100, 100, 50, 80, 1, 1)).toBe('');
    expect(arcPath(100, 100, 0, 0, 0, 1)).toBe('');
  });
});

describe(shapeArcs.name, () => {
  it('drops the root and fits the rings to the deepest level', () => {
    const shapes = shapeArcs(partition(TREE, accessors), { inner: 80, outer: 200 });

    expect(shapes.some((shape) => shape.id === 'root')).toBe(false);
    expect(byId(shapes, 'a')).toMatchObject({ r0: 80, r1: 140 });
    expect(byId(shapes, 'a1')).toMatchObject({ r0: 140, r1: 200 });
  });

  it('keeps a fixed ring count when asked', () => {
    const shapes = shapeArcs(partition(TREE, accessors), { inner: 80, outer: 200, rings: 3 });

    expect(byId(shapes, 'a')).toMatchObject({ r0: 80, r1: 120 });
  });
});

describe('arc measures', () => {
  const shape = { start: 0, end: Math.PI, r0: 50, r1: 100 };

  it('finds the centroid in the middle of the ring and the angle', () => {
    const point = arcCentroid(200, 200, shape);

    expect(point.x).toBeCloseTo(275);
    expect(point.y).toBeCloseTo(200);
  });

  it('measures the length along the middle of the ring', () => {
    expect(arcLength(shape)).toBeCloseTo(75 * Math.PI);
  });
});

describe(easeInOut.name, () => {
  it('runs from 0 to 1 through the midpoint and clamps', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });
});

describe(tweenArcs.name, () => {
  const from = [{ id: 'a', depth: 1, start: 0, end: 2, r0: 80, r1: 120 }];
  const to = [
    { id: 'a', depth: 1, start: 0, end: 4, r0: 80, r1: 200 },
    { id: 'new', depth: 2, start: 1, end: 2, r0: 100, r1: 140 },
  ];

  it('moves arcs that exist in both layouts', () => {
    expect(byId(tweenArcs(from, to, 0.5), 'a')).toEqual({ id: 'a', depth: 1, start: 0, end: 3, r0: 80, r1: 160 });
  });

  it('grows new arcs out of the old rim', () => {
    expect(byId(tweenArcs(from, to, 0), 'new')).toMatchObject({ start: 1, end: 2, r0: 120, r1: 120 });
    expect(byId(tweenArcs(from, to, 0.5), 'new')).toMatchObject({ r0: 110, r1: 130 });
  });

  it('ends exactly on the target and drops arcs that left', () => {
    expect(tweenArcs([...from, { id: 'gone', depth: 1, start: 2, end: 3, r0: 80, r1: 120 }], to, 1)).toEqual(to);
  });
});

describe(fitsInArc.name, () => {
  const top = { start: -0.5, end: 0.5, r0: 100, r1: 140 };
  const side = { start: Math.PI / 2 - 0.5, end: Math.PI / 2 + 0.5, r0: 100, r1: 140 };

  it('accepts a label that stays inside the ring and the angle', () => {
    expect(fitsInArc(top, 60, 14)).toBe(true);
  });

  it('rejects a label taller than the ring is thick', () => {
    expect(fitsInArc(top, 20, 44)).toBe(false);
  });

  it('rejects a label wider than the arc', () => {
    expect(fitsInArc(top, 160, 14)).toBe(false);
  });

  it('gives a horizontal label less room on an arc that runs vertically', () => {
    expect(fitsInArc(side, 60, 14)).toBe(false);
    expect(fitsInArc(side, 30, 14)).toBe(true);
  });

  it('only checks the ring on a full circle', () => {
    expect(fitsInArc({ start: 0, end: FULL_CIRCLE, r0: 100, r1: 140 }, 30, 14)).toBe(true);
  });

  it('handles arcs that cross twelve o’clock', () => {
    expect(fitsInArc({ start: FULL_CIRCLE - 0.5, end: FULL_CIRCLE + 0.5, r0: 100, r1: 140 }, 60, 14)).toBe(true);
  });
});

describe(arcLinePath.name, () => {
  it('runs clockwise in the upper half', () => {
    expect(arcLinePath(100, 100, 50, -Math.PI / 2, Math.PI / 2)).toBe('M 50 100 A 50 50 0 0 1 150 100');
  });

  it('runs backwards in the lower half so text reads left to right', () => {
    expect(arcLinePath(100, 100, 50, Math.PI / 2, (Math.PI * 3) / 2)).toBe('M 50 100 A 50 50 0 0 0 150 100');
  });

  it('sets the large-arc flag past half a turn', () => {
    expect(arcLinePath(100, 100, 50, -2, 2)).toContain('A 50 50 0 1 1');
  });

  it('cuts a full turn down to the top half', () => {
    expect(arcLinePath(100, 100, 50, 0, FULL_CIRCLE)).toBe('M 50 100 A 50 50 0 0 1 150 100');
  });
});

describe(isLowerHalf.name, () => {
  it('follows the middle of the arc', () => {
    expect(isLowerHalf(-0.5, 0.5)).toBe(false);
    expect(isLowerHalf(Math.PI - 0.5, Math.PI + 0.5)).toBe(true);
    expect(isLowerHalf(1, 3)).toBe(true);
    expect(isLowerHalf(0, FULL_CIRCLE)).toBe(false);
  });
});
