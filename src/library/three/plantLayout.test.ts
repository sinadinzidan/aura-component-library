import { lengthVec3 } from './cameraTargets';
import {
  anchorPosition,
  areaBounds,
  boundsOf,
  cameraTargetFor,
  equipmentBounds,
  equipmentSize,
  findNode,
  labelAnchor,
  pathTo,
  plantBounds,
} from './plantLayout';
import type { PlantEquipment, PlantLayout } from './plantLayout';

const PUMP: PlantEquipment = { id: 'p-1', kind: 'pump', tag: '27-PA-2001A', position: [10, 0, 4] };
const TURNED: PlantEquipment = { id: 'k-1', kind: 'compressor', tag: '23-KA-9101', position: [0, 0, 0], rotationY: Math.PI / 2 };

const LAYOUT: PlantLayout = {
  id: 'plant',
  name: 'Test plant',
  size: [100, 60],
  areas: [
    { id: 'a-1', tag: 'A-1', name: 'Compression', center: [0, 0], size: [20, 20], equipment: [TURNED] },
    { id: 'a-2', tag: 'A-2', name: 'Export', center: [12, 4], size: [10, 10], height: 5, equipment: [PUMP] },
  ],
  scenery: [],
  pipes: [],
};

describe(equipmentSize.name, () => {
  it('uses the model size for its kind', () => {
    expect(equipmentSize(PUMP)).toEqual([4, 2, 1.8]);
  });

  it('applies scale and a length override', () => {
    expect(equipmentSize({ ...PUMP, kind: 'pipe-rack', length: 20, scale: 2 })).toEqual([40, 11.2, 8.6]);
  });
});

describe(equipmentBounds.name, () => {
  it('stands the box on the equipment position', () => {
    expect(equipmentBounds(PUMP)).toEqual({ min: [8, 0, 3.1], max: [12, 2, 4.9] });
  });

  it('swaps the footprint for equipment turned a quarter', () => {
    const bounds = equipmentBounds(TURNED);

    expect(bounds.max[0]).toBeCloseTo(2);
    expect(bounds.max[2]).toBeCloseTo(5);
  });
});

describe('area and plant bounds', () => {
  it('boxes an area from its centre, size and height', () => {
    expect(areaBounds(LAYOUT.areas[1])).toEqual({ min: [7, 0, -1], max: [17, 5, 9] });
  });

  it('centres the plant on the origin', () => {
    expect(plantBounds(LAYOUT)).toEqual({ min: [-50, 0, -30], max: [50, 8, 30] });
  });
});

describe(findNode.name, () => {
  it('finds the plant, an area and equipment', () => {
    expect(findNode(LAYOUT, 'plant')?.type).toBe('plant');
    expect(findNode(LAYOUT, 'a-2')?.type).toBe('area');
    expect(findNode(LAYOUT, 'p-1')).toMatchObject({ type: 'equipment', area: { id: 'a-2' } });
  });

  it('returns null for an unknown id', () => {
    expect(findNode(LAYOUT, 'missing')).toBeNull();
  });
});

describe(pathTo.name, () => {
  it('lists ids from the plant down', () => {
    expect(pathTo(LAYOUT, 'plant')).toEqual(['plant']);
    expect(pathTo(LAYOUT, 'a-1')).toEqual(['plant', 'a-1']);
    expect(pathTo(LAYOUT, 'p-1')).toEqual(['plant', 'a-2', 'p-1']);
  });

  it('is empty for an unknown id', () => {
    expect(pathTo(LAYOUT, 'missing')).toEqual([]);
  });
});

describe(boundsOf.name, () => {
  it('grows an area to include equipment taller than its volume', () => {
    const tall: PlantLayout = {
      ...LAYOUT,
      areas: [{ ...LAYOUT.areas[0], equipment: [{ id: 'c-1', kind: 'column', tag: 'C-1', position: [0, 0, 0] }] }],
    };

    expect(boundsOf(tall, 'a-1')?.max[1]).toBeCloseTo(22.6);
  });

  it('returns null for an unknown id', () => {
    expect(boundsOf(LAYOUT, 'missing')).toBeNull();
  });
});

describe(cameraTargetFor.name, () => {
  it('looks at the middle of the node', () => {
    expect(cameraTargetFor(LAYOUT, 'p-1').lookAt).toEqual([10, 1, 4]);
  });

  it('stands closer for equipment than for its area, and closer for an area than the plant', () => {
    const distance = (id: string) => {
      const target = cameraTargetFor(LAYOUT, id);
      return lengthVec3([target.position[0] - target.lookAt[0], target.position[1] - target.lookAt[1], target.position[2] - target.lookAt[2]]);
    };

    expect(distance('k-1')).toBeLessThan(distance('a-1'));
    expect(distance('a-1')).toBeLessThan(distance('plant'));
  });

  it('keeps some distance from small equipment', () => {
    const target = cameraTargetFor(LAYOUT, 'p-1');

    expect(lengthVec3([target.position[0] - 10, target.position[1] - 1, target.position[2] - 4])).toBeCloseTo(15);
  });

  it('frames the whole plant for an unknown id', () => {
    expect(cameraTargetFor(LAYOUT, 'missing')).toEqual(cameraTargetFor(LAYOUT, 'plant'));
  });

  it('honours the view preset', () => {
    const top = cameraTargetFor(LAYOUT, 'plant', { view: 'top' });

    expect(top.position[1]).toBeGreaterThan(50);
    expect(Math.abs(top.position[0])).toBeLessThan(0.001);
  });
});

describe(labelAnchor.name, () => {
  it('sits above the top of the equipment', () => {
    expect(labelAnchor(PUMP, 1)).toEqual([10, 3, 4]);
  });
});

describe(anchorPosition.name, () => {
  it('maps a normalised anchor onto the footprint', () => {
    expect(anchorPosition(PUMP, [1, 0.5, -1])).toEqual([12, 1, 3.1]);
  });

  it('follows the rotation of the equipment', () => {
    const position = anchorPosition(TURNED, [1, 1, 0]);

    expect(position[0]).toBeCloseTo(0);
    expect(position[1]).toBeCloseTo(3.8);
    expect(position[2]).toBeCloseTo(-5);
  });
});
