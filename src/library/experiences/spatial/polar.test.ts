import { annularSectorPath, fanAngles, hourAngle, normalizeAngle, orbitAngles, polarPoint, rotationToFocus, shortestTurn, spoke } from './polar';

describe('normalizeAngle', () => {
  it('folds angles into one turn', () => {
    expect(normalizeAngle(370)).toBe(10);
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(720)).toBe(0);
  });
});

describe('shortestTurn', () => {
  it('turns clockwise when that is shorter', () => {
    expect(shortestTurn(10, 90)).toBe(80);
  });

  it('turns anticlockwise when that is shorter', () => {
    expect(shortestTurn(90, 10)).toBe(-80);
    expect(shortestTurn(10, 350)).toBe(-20);
  });

  it('takes half a turn clockwise', () => {
    expect(shortestTurn(0, 180)).toBe(180);
  });
});

describe('orbitAngles', () => {
  it('spreads nodes evenly from the top', () => {
    expect(orbitAngles(4)).toEqual([0, 90, 180, 270]);
  });

  it('starts at the offset', () => {
    expect(orbitAngles(3, 30)).toEqual([30, 150, 270]);
  });

  it('returns nothing for no nodes', () => {
    expect(orbitAngles(0)).toEqual([]);
  });
});

describe('rotationToFocus', () => {
  it('brings a node to 3 o clock', () => {
    expect(rotationToFocus(0)).toBe(90);
    expect(rotationToFocus(90)).toBe(0);
  });

  it('goes the shorter way round', () => {
    expect(rotationToFocus(320)).toBe(130);
    expect(rotationToFocus(200)).toBe(-110);
  });

  it('continues from the current rotation instead of unwinding', () => {
    const first = rotationToFocus(320, 0);
    const second = rotationToFocus(280, first);

    expect(second).toBe(170);
    expect(normalizeAngle(280 + second)).toBe(90);
  });

  it('leaves the ring alone when the node is already in focus', () => {
    expect(rotationToFocus(40, 50)).toBe(50);
  });

  it('accepts another focus position', () => {
    expect(rotationToFocus(0, 0, 180)).toBe(180);
  });
});

describe('hourAngle', () => {
  it('puts midnight at the top and noon at the bottom of a 24-hour ring', () => {
    expect(hourAngle(0)).toBe(0);
    expect(hourAngle(6)).toBe(90);
    expect(hourAngle(12)).toBe(180);
    expect(hourAngle(24)).toBe(0);
  });

  it('supports a 12-hour ring', () => {
    expect(hourAngle(3, 12)).toBe(90);
  });
});

describe('fanAngles', () => {
  it('centres equal segments on the given angle', () => {
    expect(fanAngles(3, 90, 64, 2)).toEqual([
      { start: 58, end: 78 },
      { start: 80, end: 100 },
      { start: 102, end: 122 },
    ]);
  });

  it('gives one segment the whole spread', () => {
    expect(fanAngles(1, 90, 40)).toEqual([{ start: 70, end: 110 }]);
  });

  it('returns nothing when the gaps leave no room', () => {
    expect(fanAngles(5, 90, 8, 2)).toEqual([]);
    expect(fanAngles(0, 90, 60)).toEqual([]);
  });
});

describe('polarPoint and spoke', () => {
  it('measures angles clockwise from 12 o clock', () => {
    expect(polarPoint(100, 100, 50, 0)).toEqual({ x: 100, y: 50 });
    expect(polarPoint(100, 100, 50, 90)).toEqual({ x: 150, y: 100 });
  });

  it('draws a spoke between two radii', () => {
    expect(spoke(100, 100, 20, 50, 90)).toEqual({ x1: 120, y1: 100, x2: 150, y2: 100 });
  });
});

describe('annularSectorPath', () => {
  it('closes a ring segment through both arcs', () => {
    expect(annularSectorPath(100, 100, 40, 50, 0, 90)).toBe('M 100 50 A 50 50 0 0 1 150 100 L 140 100 A 40 40 0 0 0 100 60 Z');
  });

  it('uses the large arc past half a turn', () => {
    expect(annularSectorPath(100, 100, 40, 50, 0, 270)).toContain('A 50 50 0 1 1');
  });

  it('is empty without area', () => {
    expect(annularSectorPath(100, 100, 40, 50, 90, 90)).toBe('');
    expect(annularSectorPath(100, 100, 50, 50, 0, 90)).toBe('');
  });
});
