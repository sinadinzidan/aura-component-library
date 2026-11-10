import { cycleTarget, labelOffset, layoutBlips, ringTicks, rulerTicks, scoreRadius, sectorBounds } from './radar';

describe('sectorBounds', () => {
  it('splits the circle into equal sectors from 12 o’clock', () => {
    expect(sectorBounds(0, 4)).toEqual({ start: 0, end: 90, mid: 45 });
    expect(sectorBounds(3, 4)).toEqual({ start: 270, end: 360, mid: 315 });
  });

  it('gives one sector the whole circle', () => {
    expect(sectorBounds(0, 1)).toEqual({ start: 0, end: 360, mid: 180 });
  });
});

describe('scoreRadius', () => {
  it('puts the best score on the outer ring and the worst at the inner', () => {
    expect(scoreRadius(100, { inner: 20, outer: 100 })).toBe(100);
    expect(scoreRadius(0, { inner: 20, outer: 100 })).toBe(20);
    expect(scoreRadius(50, { inner: 20, outer: 100 })).toBe(60);
  });

  it('uses a custom score range and clamps outside it', () => {
    expect(scoreRadius(70, { inner: 0, outer: 100, min: 40, max: 100 })).toBe(50);
    expect(scoreRadius(10, { inner: 0, outer: 100, min: 40, max: 100 })).toBe(0);
    expect(scoreRadius(140, { inner: 0, outer: 100, min: 40, max: 100 })).toBe(100);
  });
});

describe('layoutBlips', () => {
  const groups = [
    { id: 'north', items: [{ id: 'a', health: 100 }, { id: 'b', health: 0 }] },
    { id: 'south', items: [{ id: 'c', health: 50 }] },
  ];
  const layout = { cx: 100, cy: 100, inner: 10, outer: 90, sectorPadding: 10 };

  it('returns one blip per item, tagged with its group', () => {
    const blips = layoutBlips(groups, (item) => item.health, layout);
    expect(blips.map((blip) => [blip.item.id, blip.groupId])).toEqual([['a', 'north'], ['b', 'north'], ['c', 'south']]);
  });

  it('keeps every blip inside its sector, clear of the dividers', () => {
    const [a, b, c] = layoutBlips(groups, (item) => item.health, layout);
    expect(a.angle).toBe(50);
    expect(b.angle).toBe(130);
    expect(c.angle).toBe(270);
  });

  it('takes the radius from the score', () => {
    const [a, b, c] = layoutBlips(groups, (item) => item.health, layout);
    expect([a.radius, b.radius, c.radius]).toEqual([90, 10, 50]);
  });

  it('converts to screen coordinates', () => {
    const [, , c] = layoutBlips(groups, (item) => item.health, layout);
    expect(c.x).toBe(50);
    expect(c.y).toBe(100);
  });
});

describe('ringTicks', () => {
  it('returns one tick per step, pointing inwards', () => {
    const ticks = ringTicks(100, 100, 50, 4, 5);
    expect(ticks).toHaveLength(4);
    expect(ticks[0]).toEqual({ x1: 100, y1: 50, x2: 100, y2: 55 });
  });

  it('makes every nth tick a major tick', () => {
    const ticks = ringTicks(100, 100, 50, 4, 5, 2, 12);
    expect(ticks[0].y2).toBe(62);
    expect(ticks[2].y2).toBe(138);
    expect(ticks[1].x2).toBe(145);
  });
});

describe('cycleTarget', () => {
  const ids = ['a', 'b', 'c'];

  it('moves to the next and previous id', () => {
    expect(cycleTarget(ids, 'a', 1)).toBe('b');
    expect(cycleTarget(ids, 'b', -1)).toBe('a');
  });

  it('wraps round at both ends', () => {
    expect(cycleTarget(ids, 'c', 1)).toBe('a');
    expect(cycleTarget(ids, 'a', -1)).toBe('c');
  });

  it('starts at the first or last id when nothing is current', () => {
    expect(cycleTarget(ids, null, 1)).toBe('a');
    expect(cycleTarget(ids, null, -1)).toBe('c');
    expect(cycleTarget(ids, 'gone', 1)).toBe('a');
  });

  it('is null for an empty list', () => {
    expect(cycleTarget([], null, 1)).toBeNull();
  });
});

describe('rulerTicks', () => {
  it('marks every step and flags the major ones', () => {
    const ticks = rulerTicks(100, 10, 5);
    expect(ticks).toHaveLength(11);
    expect(ticks.filter((tick) => tick.major).map((tick) => tick.position)).toEqual([0, 50, 100]);
  });

  it('is empty for a non-positive step or length', () => {
    expect(rulerTicks(100, 0)).toEqual([]);
    expect(rulerTicks(0, 10)).toEqual([]);
  });
});

describe('labelOffset', () => {
  it('pushes a label away from the centre', () => {
    expect(labelOffset({ x: 150, y: 100 }, 100, 100, 10)).toEqual({ x: 160, y: 100 });
    expect(labelOffset({ x: 100, y: 40 }, 100, 100, 10)).toEqual({ x: 100, y: 30 });
  });
});
