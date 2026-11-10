import { profileDomain, profilePath, profilePoints, stopX } from './profileGeometry';

describe('stopX', () => {
  it('puts each stop on the centre of its column', () => {
    expect(stopX(0, 4, 400)).toBe(50);
    expect(stopX(3, 4, 400)).toBe(350);
  });

  it('returns 0 for an empty route', () => {
    expect(stopX(0, 0, 400)).toBe(0);
  });
});

describe('profileDomain', () => {
  it('spans the values', () => {
    expect(profileDomain([14, 48, 142])).toEqual([14, 142]);
  });

  it('widens a flat profile', () => {
    expect(profileDomain([5, 5])).toEqual([4, 6]);
  });

  it('has a default for no values', () => {
    expect(profileDomain([])).toEqual([0, 1]);
  });
});

describe('profilePoints', () => {
  const box = { width: 300, height: 100, paddingY: 10 };

  it('scales the highest value to the top padding and the lowest to the bottom', () => {
    const points = profilePoints([0, 50, 100], box);
    expect(points).toEqual([
      { x: 50, y: 90 },
      { x: 150, y: 50 },
      { x: 250, y: 10 },
    ]);
  });

  it('honours an explicit domain', () => {
    expect(profilePoints([50], box, [0, 100])[0]).toEqual({ x: 150, y: 50 });
  });
});

describe('profilePath', () => {
  it('is empty without points', () => {
    expect(profilePath([])).toBe('');
  });

  it('eases between stops with horizontal tangents', () => {
    const path = profilePath([
      { x: 50, y: 90 },
      { x: 150, y: 10 },
    ]);
    expect(path).toBe('M 50 90 C 100 90 100 10 150 10');
  });

  it('extends flat to both edges when a width is given', () => {
    const path = profilePath(
      [
        { x: 50, y: 90 },
        { x: 150, y: 10 },
      ],
      200
    );
    expect(path.startsWith('M 0 90 L 50 90')).toBe(true);
    expect(path.endsWith('L 200 10')).toBe(true);
  });
});
