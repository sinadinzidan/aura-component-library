import { planLength } from './drapeOnTerrain';
import { selectableIds } from './subseaField';
import { SUBSEA_METRES_PER_UNIT, buildSubseaLayout, isLazyWave, subseaHeight } from './subseaFieldData';

const LAYOUT = buildSubseaLayout();

const near = (a: readonly number[], b: readonly number[], tolerance: number): boolean => Math.hypot(a[0] - b[0], a[2] - b[2]) <= tolerance;

describe(buildSubseaLayout.name, () => {
  it('is deterministic', () => {
    expect(buildSubseaLayout()).toEqual(LAYOUT);
  });

  it('has unique ids and tags', () => {
    const ids = [...LAYOUT.structures.map((item) => item.id), ...LAYOUT.lines.map((item) => item.id)];
    const tags = [...LAYOUT.structures.map((item) => item.tag), ...LAYOUT.lines.map((item) => item.tag)];

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('has templates, a manifold and a pipeline end termination on the seabed', () => {
    expect(LAYOUT.structures.filter((item) => item.kind === 'template').length).toBeGreaterThanOrEqual(3);
    expect(LAYOUT.structures.some((item) => item.kind === 'manifold')).toBe(true);
    expect(LAYOUT.structures.some((item) => item.kind === 'plet')).toBe(true);
  });

  it('has all four networks', () => {
    const systems = new Set([...LAYOUT.structures.map((item) => item.system), ...LAYOUT.lines.map((item) => item.system)]);

    expect([...systems].sort()).toEqual(['control', 'injection', 'mooring', 'production']);
  });

  it('lands each flowline on the structures it connects', () => {
    const position = (id: string) => LAYOUT.structures.find((item) => item.id === id)?.position ?? [0, 0];
    const line = (id: string) => LAYOUT.lines.find((item) => item.id === id)?.points ?? [];
    const ends = (id: string) => [line(id)[0], line(id)[line(id).length - 1]] as const;

    expect(near(ends('fl-a')[0], [position('t-a')[0], 0, position('t-a')[1]], 0.01)).toBe(true);
    expect(near(ends('fl-a')[1], [position('m-1')[0], 0, position('m-1')[1]], 0.01)).toBe(true);
    expect(near(ends('exp-1')[1], [position('plet-1')[0], 0, position('plet-1')[1]], 0.01)).toBe(true);
    expect(near(ends('ij-1')[1], [position('t-d')[0], 0, position('t-d')[1]], 0.01)).toBe(true);
  });

  it('drapes seabed lines on the terrain', () => {
    for (const line of LAYOUT.lines.filter((item) => item.kind === 'flowline' || item.kind === 'umbilical')) {
      for (const [x, y, z] of line.points) expect(y).toBeCloseTo(subseaHeight(x, z) + 0.25, 6);
    }
  });

  it('makes the flowlines snake: longer than the straight run', () => {
    const line = LAYOUT.lines.find((item) => item.id === 'fl-c');
    const plan = (line?.points ?? []).map((point) => [point[0], point[2]] as const);

    expect(planLength(plan)).toBeGreaterThan(Math.hypot(-54 - -46, 36 - -4));
  });

  it('runs risers in lazy-wave shape between the turret and the seabed', () => {
    const risers = LAYOUT.lines.filter((item) => item.kind === 'riser');

    expect(risers).toHaveLength(3);
    for (const riser of risers) {
      expect(isLazyWave(riser.points)).toBe(true);
      const heights = riser.points.map((point) => point[1]);
      expect(Math.max(...heights)).toBeCloseTo(37, 6);
      expect(Math.min(...heights)).toBeLessThan(3);
    }
  });

  it('runs production flow towards the vessel and injection away from it', () => {
    const top = (id: string) => {
      const points = LAYOUT.lines.find((item) => item.id === id)?.points ?? [];
      return points[points.length - 1][1] > points[0][1];
    };

    expect(top('rs-1')).toBe(true);
    expect(top('rs-2')).toBe(false);
  });

  it('moors the vessel with six lines that rise from the seabed to the turret', () => {
    const moorings = LAYOUT.lines.filter((item) => item.kind === 'mooring');

    expect(moorings).toHaveLength(6);
    for (const line of moorings) {
      expect(line.points[0][1]).toBeLessThan(3);
      expect(line.points[line.points.length - 1][1]).toBeGreaterThan(35);
    }
  });

  it('keeps everything inside the mapped seabed', () => {
    for (const line of LAYOUT.lines) {
      for (const [x, , z] of line.points) {
        expect(Math.abs(x)).toBeLessThanOrEqual(LAYOUT.size[0] / 2);
        expect(Math.abs(z)).toBeLessThanOrEqual(LAYOUT.size[1] / 2);
      }
    }
  });

  it('makes templates, flowlines and risers selectable', () => {
    const ids = selectableIds(LAYOUT);

    expect(ids).toEqual(expect.arrayContaining(['t-a', 't-d', 'fl-a', 'rs-1', 'rs-2', 'ru-1']));
    expect(ids).not.toContain('ml-1');
  });

  it('puts the surface at the water depth', () => {
    expect(LAYOUT.waterDepth * SUBSEA_METRES_PER_UNIT).toBe(480);
  });
});

describe(isLazyWave.name, () => {
  it('rejects a straight line', () => {
    expect(isLazyWave([[0, 10, 0], [0, 5, 0], [0, 0, 0]])).toBe(false);
  });
});
