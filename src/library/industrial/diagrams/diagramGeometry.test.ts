import {
  arrowHeadPath,
  arrowPositions,
  circlePath,
  directionBetween,
  estimateTextWidth,
  placePoint,
  pointAlong,
  polylineLength,
  polylinePath,
  reverseDirection,
  round2,
} from './diagramGeometry';

const ROUTE = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 50 },
];

describe('diagramGeometry', () => {
  describe(round2.name, () => {
    it('rounds to two decimals', () => {
      expect(round2(1.23456)).toBe(1.23);
    });
  });

  describe(circlePath.name, () => {
    it('draws two absolute half arcs and closes', () => {
      expect(circlePath(12, 12, 8)).toBe('M 4 12 A 8 8 0 1 0 20 12 A 8 8 0 1 0 4 12 Z');
    });
  });

  describe(polylinePath.name, () => {
    it('joins points with line commands', () => {
      expect(polylinePath(ROUTE)).toBe('M 0 0 L 100 0 L 100 50');
    });

    it('is empty with fewer than two points', () => {
      expect(polylinePath([{ x: 1, y: 1 }])).toBe('');
    });
  });

  describe(polylineLength.name, () => {
    it('sums the segments', () => {
      expect(polylineLength(ROUTE)).toBe(150);
    });

    it('is zero for a single point', () => {
      expect(polylineLength([{ x: 5, y: 5 }])).toBe(0);
    });
  });

  describe(directionBetween.name, () => {
    it.each([
      [{ x: 10, y: 0 }, 'right'],
      [{ x: -10, y: 0 }, 'left'],
      [{ x: 0, y: 10 }, 'down'],
      [{ x: 0, y: -10 }, 'up'],
      [{ x: 10, y: 4 }, 'right'],
    ] as const)('reads the direction to %o as %s', (to, expected) => {
      expect(directionBetween({ x: 0, y: 0 }, to)).toBe(expected);
    });
  });

  describe(reverseDirection.name, () => {
    it('flips each direction', () => {
      expect(reverseDirection('right')).toBe('left');
      expect(reverseDirection('up')).toBe('down');
    });
  });

  describe(pointAlong.name, () => {
    it('finds a point on the first segment', () => {
      expect(pointAlong(ROUTE, 0.5)).toEqual({ point: { x: 75, y: 0 }, direction: 'right' });
    });

    it('finds a point on a later segment with its direction', () => {
      expect(pointAlong(ROUTE, 0.8)).toEqual({ point: { x: 100, y: 20 }, direction: 'down' });
    });

    it('clamps the fraction to the route', () => {
      expect(pointAlong(ROUTE, 2)?.point).toEqual({ x: 100, y: 50 });
      expect(pointAlong(ROUTE, -1)?.point).toEqual({ x: 0, y: 0 });
    });

    it('returns null when the route has no length', () => {
      expect(pointAlong([{ x: 1, y: 1 }], 0.5)).toBeNull();
      expect(pointAlong([{ x: 1, y: 1 }, { x: 1, y: 1 }], 0.5)).toBeNull();
    });
  });

  describe(arrowPositions.name, () => {
    it('puts a single arrow in the middle', () => {
      expect(arrowPositions([{ x: 0, y: 0 }, { x: 60, y: 0 }], 1)).toEqual([{ point: { x: 30, y: 0 }, direction: 'right' }]);
    });

    it('spreads several arrows evenly', () => {
      const positions = arrowPositions([{ x: 0, y: 0 }, { x: 90, y: 0 }], 2);

      expect(positions.map((position) => position.point.x)).toEqual([30, 60]);
    });

    it('is empty for no arrows', () => {
      expect(arrowPositions(ROUTE, 0)).toEqual([]);
    });
  });

  describe(arrowHeadPath.name, () => {
    it('points right with the tip ahead of the centre', () => {
      expect(arrowHeadPath({ x: 10, y: 10 }, 'right', 6)).toBe('M 7 7 L 13 10 L 7 13 Z');
    });

    it('points down with the tip below the centre', () => {
      expect(arrowHeadPath({ x: 10, y: 10 }, 'down', 6)).toBe('M 7 7 L 10 13 L 13 7 Z');
    });

    it('points left and up', () => {
      expect(arrowHeadPath({ x: 10, y: 10 }, 'left', 6)).toBe('M 13 7 L 7 10 L 13 13 Z');
      expect(arrowHeadPath({ x: 10, y: 10 }, 'up', 6)).toBe('M 7 13 L 10 7 L 13 13 Z');
    });
  });

  describe(placePoint.name, () => {
    it('scales a grid point into the diagram around the symbol centre', () => {
      expect(placePoint({ x: 4, y: 12 }, 24, 100, 50, 48)).toEqual({ x: 84, y: 50 });
    });

    it('keeps the grid centre on the symbol centre', () => {
      expect(placePoint({ x: 12, y: 12 }, 24, 100, 50, 36)).toEqual({ x: 100, y: 50 });
    });
  });

  describe(estimateTextWidth.name, () => {
    it('grows with length and font size', () => {
      expect(estimateTextWidth('48.6', 12)).toBeLessThan(estimateTextWidth('182,400', 12));
      expect(estimateTextWidth('48.6', 10)).toBeLessThan(estimateTextWidth('48.6', 12));
    });

    it('is wider for monospace', () => {
      expect(estimateTextWidth('23-PT-92531', 10, true)).toBeGreaterThan(estimateTextWidth('23-PT-92531', 10));
    });
  });
});
