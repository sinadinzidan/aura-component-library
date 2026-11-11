import { cylinderBody, labelSlots, layoutParts } from './explode';

const PARTS = [
  { id: 'a', length: 40 },
  { id: 'wheel', length: 10, inside: true },
  { id: 'b', length: 60 },
];

describe('layoutParts', () => {
  it('packs the parts end to end when collapsed, with inside parts hidden at the joint', () => {
    expect(layoutParts(PARTS, false, 200, 20)).toEqual([
      { id: 'a', start: 50, centre: 70, end: 90 },
      { id: 'wheel', start: 85, centre: 90, end: 95 },
      { id: 'b', start: 90, centre: 120, end: 150 },
    ]);
  });

  it('gives every part its own place when exploded', () => {
    expect(layoutParts(PARTS, true, 200, 20)).toEqual([
      { id: 'a', start: 25, centre: 45, end: 65 },
      { id: 'wheel', start: 85, centre: 90, end: 95 },
      { id: 'b', start: 115, centre: 145, end: 175 },
    ]);
  });

  it('keeps both layouts centred', () => {
    for (const exploded of [false, true]) {
      const slots = layoutParts(PARTS, exploded, 200, 20);
      expect(slots[0].start + slots[slots.length - 1].end).toBe(200);
    }
  });
});

describe('labelSlots', () => {
  it('spreads slot centres evenly', () => {
    expect(labelSlots(4, 400)).toEqual([50, 150, 250, 350]);
  });
});

describe('cylinderBody', () => {
  it('draws a closed outline with rounded ends', () => {
    expect(cylinderBody(10, 50, 100, 20, 0.25)).toBe('M 10 80 L 50 80 A 5 20 0 0 1 50 120 L 10 120 A 5 20 0 0 1 10 80 Z');
  });
});
