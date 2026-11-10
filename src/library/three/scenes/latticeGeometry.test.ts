import { boomMembers, boomSection, countMembers, towerCorners, towerMembers } from './latticeGeometry';
import type { BoomShape, TowerShape } from './latticeGeometry';

const TOWER: TowerShape = { base: [20, 10], top: [10, 6], bottomY: -4, topY: 12, bays: 2 };
const BOOM: BoomShape = { length: 24, width: 3, tipWidth: 1, bays: 4 };

describe(towerCorners.name, () => {
  it('returns the base corners at the bottom', () => {
    expect(towerCorners(TOWER, 0)).toEqual([
      [-10, -4, -5],
      [10, -4, -5],
      [10, -4, 5],
      [-10, -4, 5],
    ]);
  });

  it('tapers to the top size', () => {
    expect(towerCorners(TOWER, 1)[2]).toEqual([5, 12, 3]);
  });

  it('interpolates size and height in between', () => {
    expect(towerCorners(TOWER, 0.5)[1]).toEqual([7.5, 4, -4]);
  });

  it('clamps the fraction', () => {
    expect(towerCorners(TOWER, 4)).toEqual(towerCorners(TOWER, 1));
  });
});

describe(towerMembers.name, () => {
  it('builds four legs from bottom to top', () => {
    const legs = towerMembers(TOWER).filter((member) => member.kind === 'leg');

    expect(legs).toHaveLength(4);
    expect(legs[0]).toEqual({ from: [-10, -4, -5], to: [-5, 12, -3], kind: 'leg' });
  });

  it('adds a ring at every bay boundary and x-bracing on every face', () => {
    expect(countMembers(towerMembers(TOWER))).toEqual({ leg: 4, ring: 12, brace: 16 });
  });

  it('halves the bracing for a zigzag', () => {
    expect(countMembers(towerMembers({ ...TOWER, bracing: 'zigzag' })).brace).toBe(8);
  });

  it('keeps at least one bay', () => {
    expect(countMembers(towerMembers({ ...TOWER, bays: 0 }))).toEqual({ leg: 4, ring: 8, brace: 8 });
  });

  it('keeps every brace between neighbouring rings', () => {
    const braces = towerMembers(TOWER).filter((member) => member.kind === 'brace');

    expect(braces.every((member) => Math.abs(member.to[1] - member.from[1]) === 8)).toBe(true);
  });
});

describe(boomSection.name, () => {
  it('starts at the heel with the full width', () => {
    expect(boomSection(BOOM, 0)[0]).toEqual([0, 0, -1.5]);
    expect(boomSection(BOOM, 0)[1]).toEqual([0, 0, 1.5]);
  });

  it('narrows to the tip width at the full length', () => {
    expect(boomSection(BOOM, 1)[1]).toEqual([24, 0, 0.5]);
  });

  it('defaults the tip to a third of the heel', () => {
    expect(boomSection({ length: 9, width: 3, bays: 3 }, 1)[1]).toEqual([9, 0, 0.5]);
  });
});

describe(boomMembers.name, () => {
  it('builds three chords, a triangle per section and a diagonal per face per bay', () => {
    expect(countMembers(boomMembers(BOOM))).toEqual({ leg: 3, ring: 15, brace: 12 });
  });

  it('runs the chords the whole length', () => {
    const [chord] = boomMembers(BOOM);

    expect(chord.from[0]).toBe(0);
    expect(chord.to[0]).toBe(24);
  });
});
