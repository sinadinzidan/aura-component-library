import {
  DEPTH_LEVELS,
  depthInMetres,
  depthLevelTarget,
  isGhosted,
  itemAnchor,
  itemCameraTarget,
  lineBounds,
  lineMidpoint,
  rovStation,
  selectableIds,
  systemOf,
  turretPosition,
} from './subseaField';
import type { SubseaFieldLayout } from './subseaField';

const flat = () => 0;
const slope = (x: number) => x * 0.1;

const LAYOUT: SubseaFieldLayout = {
  size: [200, 150],
  waterDepth: 40,
  fieldCenter: [-40, 0],
  vessel: { id: 'fpso', tag: 'FPSO', position: [50, 40, 0], length: 50 },
  structures: [
    { id: 't-a', tag: 'T-A', kind: 'template', system: 'production', position: [-60, -20], slots: 4 },
    { id: 't-d', tag: 'T-D', kind: 'template', system: 'injection', position: [-30, -40] },
    { id: 'anchor', tag: 'Anchor', kind: 'termination', system: 'mooring', position: [0, 60], selectable: false },
  ],
  lines: [
    { id: 'fl-1', tag: 'FL-1', kind: 'flowline', system: 'production', selectable: true, flow: true, points: [[-60, 0, -20], [-40, 0, -20], [-40, 0, 0]] },
    { id: 'ml-1', tag: 'ML-1', kind: 'mooring', system: 'mooring', points: [[0, 0, 60], [32, 37, 0]] },
  ],
};

describe(isGhosted.name, () => {
  it('ghosts nothing under the all filter', () => {
    expect(isGhosted('all', 'mooring')).toBe(false);
  });

  it('ghosts every system but the chosen one', () => {
    expect(isGhosted('production', 'production')).toBe(false);
    expect(isGhosted('production', 'injection')).toBe(true);
  });
});

describe(turretPosition.name, () => {
  it('sits towards the bow, below the waterline', () => {
    expect(turretPosition(LAYOUT.vessel)).toEqual([32, 37, 0]);
  });

  it('turns with the vessel', () => {
    const [x, , z] = turretPosition({ ...LAYOUT.vessel, rotationY: Math.PI / 2 });

    expect(x).toBeCloseTo(50, 9);
    expect(z).toBeCloseTo(18, 9);
  });
});

describe(lineMidpoint.name, () => {
  it('is halfway along the line by length', () => {
    expect(lineMidpoint(LAYOUT.lines[0].points)).toEqual([-40, 0, -20]);
  });

  it('handles short input', () => {
    expect(lineMidpoint([])).toBeNull();
    expect(lineMidpoint([[1, 2, 3]])).toEqual([1, 2, 3]);
  });
});

describe(lineBounds.name, () => {
  it('encloses every point', () => {
    expect(lineBounds(LAYOUT.lines[1].points)).toEqual({ min: [0, 0, 0], max: [32, 37, 60] });
  });

  it('is null for no points', () => {
    expect(lineBounds([])).toBeNull();
  });
});

describe(itemAnchor.name, () => {
  it('puts a structure on the terrain', () => {
    expect(itemAnchor(LAYOUT, 't-a', slope)).toEqual([-60, -6, -20]);
  });

  it('uses the midpoint of a line and the deck of the vessel', () => {
    expect(itemAnchor(LAYOUT, 'fl-1', flat)).toEqual([-40, 0, -20]);
    expect(itemAnchor(LAYOUT, 'fpso', flat)).toEqual([50, 40, 0]);
  });

  it('is null for an unknown id', () => {
    expect(itemAnchor(LAYOUT, 'nope', flat)).toBeNull();
  });
});

describe(systemOf.name, () => {
  it('finds the system of structures and lines', () => {
    expect(systemOf(LAYOUT, 't-d')).toBe('injection');
    expect(systemOf(LAYOUT, 'ml-1')).toBe('mooring');
  });

  it('is null for the vessel', () => {
    expect(systemOf(LAYOUT, 'fpso')).toBeNull();
  });
});

describe(depthLevelTarget.name, () => {
  it('looks at the vessel from above at the surface', () => {
    const target = depthLevelTarget(LAYOUT, 'surface');

    expect(target.lookAt).toEqual([50, 40, 0]);
    expect(target.position[1]).toBeGreaterThan(40);
  });

  it('looks across the middle of the water column', () => {
    const target = depthLevelTarget(LAYOUT, 'water-column');

    expect(target.lookAt[1]).toBeGreaterThan(10);
    expect(target.lookAt[1]).toBeLessThan(30);
    expect(target.position[1]).toBeLessThan(40);
    expect(target.position[1]).toBeGreaterThan(target.lookAt[1]);
  });

  it('looks down at the installations from below the surface at the seabed', () => {
    const target = depthLevelTarget(LAYOUT, 'seabed');

    expect(target.lookAt[0]).toBe(-40);
    expect(target.lookAt[1]).toBeLessThan(5);
    expect(target.position[1]).toBeLessThan(40);
  });

  it('puts the three cameras at three altitudes, highest first', () => {
    const heights = DEPTH_LEVELS.map((level) => depthLevelTarget(LAYOUT, level).lookAt[1]);

    expect(heights[0]).toBeGreaterThan(heights[1]);
    expect(heights[1]).toBeGreaterThan(heights[2]);
  });
});

describe(itemCameraTarget.name, () => {
  it('looks at a structure', () => {
    const target = itemCameraTarget(LAYOUT, 't-a', flat);

    expect(target?.lookAt[0]).toBe(-60);
    expect(target?.lookAt[2]).toBe(-20);
  });

  it('frames the whole of a line', () => {
    const target = itemCameraTarget(LAYOUT, 'ml-1', flat);

    expect(target?.lookAt).toEqual([16, 18.5, 30]);
  });

  it('stands further from the vessel than from a template', () => {
    const distance = (id: string) => {
      const target = itemCameraTarget(LAYOUT, id, flat);
      return target ? Math.hypot(target.position[0] - target.lookAt[0], target.position[1] - target.lookAt[1], target.position[2] - target.lookAt[2]) : 0;
    };

    expect(distance('fpso')).toBeGreaterThan(distance('t-a'));
  });

  it('is null for an unknown id', () => {
    expect(itemCameraTarget(LAYOUT, 'nope', flat)).toBeNull();
  });
});

describe(rovStation.name, () => {
  it('hovers beside and above the item', () => {
    expect(rovStation(LAYOUT, 't-a', flat, 3)).toEqual([-56.5, 3, -15.5]);
  });

  it('keeps its clearance over rising ground', () => {
    const steep = (x: number) => (x > -58 ? 10 : 0);
    const station = rovStation(LAYOUT, 't-a', steep, 3);

    expect(station?.[1]).toBe(13);
  });

  it('is null for an unknown id', () => {
    expect(rovStation(LAYOUT, 'nope', flat)).toBeNull();
  });
});

describe(depthInMetres.name, () => {
  it('is zero at the surface and grows downwards', () => {
    expect(depthInMetres(LAYOUT, 40, 9)).toBe(0);
    expect(depthInMetres(LAYOUT, 0, 9)).toBe(360);
  });

  it('never goes negative above the surface', () => {
    expect(depthInMetres(LAYOUT, 55, 9)).toBe(0);
  });
});

describe(selectableIds.name, () => {
  it('lists selectable structures, then selectable lines', () => {
    expect(selectableIds(LAYOUT)).toEqual(['t-a', 't-d', 'fl-1']);
  });
});
