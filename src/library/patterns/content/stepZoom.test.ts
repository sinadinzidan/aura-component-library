import { stepZoom } from './stepZoom';

describe(stepZoom.name, () => {
  it('moves to the next level in each direction', () => {
    expect(stepZoom(100, 'in')).toBe(125);
    expect(stepZoom(100, 'out')).toBe(75);
  });

  it('stays put at the ends', () => {
    expect(stepZoom(200, 'in')).toBe(200);
    expect(stepZoom(50, 'out')).toBe(50);
  });

  it('snaps a level between steps to the nearest one in the direction', () => {
    expect(stepZoom(110, 'in')).toBe(125);
    expect(stepZoom(110, 'out')).toBe(100);
  });

  it('accepts steps in any order', () => {
    expect(stepZoom(100, 'in', [200, 50, 100])).toBe(200);
  });
});
