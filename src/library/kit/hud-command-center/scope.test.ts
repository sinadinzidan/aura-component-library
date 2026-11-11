import { focusRotation, placeContact, scoreRadius, sectorSize, slotAngle, stepFocus } from './scope';

describe('sectorSize', () => {
  it('splits the turn evenly', () => {
    expect(sectorSize(6)).toBe(60);
  });
});

describe('focusRotation', () => {
  it('brings the middle of the focus sector to the top', () => {
    expect(focusRotation(0, 6)).toBe(-30);
    expect(focusRotation(2, 6)).toBe(-150);
  });
});

describe('stepFocus', () => {
  it('moves forward and wraps', () => {
    expect(stepFocus(5, 1, 6)).toBe(0);
  });

  it('moves backward and wraps', () => {
    expect(stepFocus(0, -1, 6)).toBe(5);
  });
});

describe('scoreRadius', () => {
  it('puts the best score at the inner radius and the worst at the rim', () => {
    expect(scoreRadius(100, 100, 40, 40, 280)).toBe(40);
    expect(scoreRadius(40, 100, 40, 40, 280)).toBe(280);
  });

  it('clamps scores outside the range', () => {
    expect(scoreRadius(10, 100, 40, 40, 280)).toBe(280);
  });
});

describe('slotAngle', () => {
  it('centres a single contact in its sector', () => {
    expect(slotAngle(1, 6, 0, 1)).toBe(90);
  });

  it('keeps contacts off the sector lines', () => {
    expect(slotAngle(0, 6, 0, 3)).toBeCloseTo(9.6);
    expect(slotAngle(0, 6, 2, 3)).toBeCloseTo(50.4);
  });
});

describe('placeContact', () => {
  it('applies the scope rotation', () => {
    expect(placeContact(0, 6, 0, 1, 120, focusRotation(0, 6))).toEqual({ angle: 0, radius: 120 });
  });
});
