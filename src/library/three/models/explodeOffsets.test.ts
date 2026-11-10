import { COMPRESSOR_TRAIN_BOUNDS, COMPRESSOR_TRAIN_EXPLODE, TRAIN_ASSEMBLY_IDS, TRAIN_MEASUREMENT_POINTS, isTrainAssemblyId } from './compressorTrainLayout';
import { explodeOffset, explodeOffsets, explodeProgress, explodedBounds } from './explodeOffsets';

describe(explodeProgress.name, () => {
  it('follows the amount when the part starts at once', () => {
    expect(explodeProgress(0)).toBe(0);
    expect(explodeProgress(0.25)).toBe(0.25);
    expect(explodeProgress(1)).toBe(1);
  });

  it('waits until its start, then covers the rest of the range', () => {
    expect(explodeProgress(0.2, 0.3)).toBe(0);
    expect(explodeProgress(0.65, 0.3)).toBeCloseTo(0.5);
    expect(explodeProgress(1, 0.3)).toBe(1);
  });

  it('clamps amounts outside 0–1', () => {
    expect(explodeProgress(-1)).toBe(0);
    expect(explodeProgress(4)).toBe(1);
  });

  it('jumps at the very end when the start is 1', () => {
    expect(explodeProgress(0.99, 1)).toBe(0);
    expect(explodeProgress(1, 1)).toBe(1);
  });
});

describe(explodeOffset.name, () => {
  it('is zero when assembled', () => {
    expect(explodeOffset({ direction: [1, 0, 0], distance: 4 }, 0)).toEqual([0, 0, 0]);
  });

  it('travels the full distance along the direction when exploded', () => {
    expect(explodeOffset({ direction: [-1, 0, 0], distance: 4 }, 1)).toEqual([-4, 0, 0]);
  });

  it('normalises the direction', () => {
    const [x, y, z] = explodeOffset({ direction: [0, 3, 4], distance: 10 }, 1);

    expect([x, y, z].map((value) => Math.round(value * 1000) / 1000)).toEqual([0, 6, 8]);
  });

  it('scales with the amount', () => {
    expect(explodeOffset({ direction: [0, 0, 1], distance: 4 }, 0.5)).toEqual([0, 0, 2]);
  });

  it('stays put for a part without a direction', () => {
    expect(explodeOffset({ direction: [0, 0, 0], distance: 4 }, 1)).toEqual([0, 0, 0]);
  });
});

describe(explodeOffsets.name, () => {
  it('returns an offset for every part', () => {
    const offsets = explodeOffsets({ a: { direction: [1, 0, 0], distance: 2 }, b: { direction: [0, 1, 0], distance: 1, start: 0.5 } }, 0.5);

    expect(offsets).toEqual({ a: [1, 0, 0], b: [0, 0, 0] });
  });
});

describe(explodedBounds.name, () => {
  const bounds = { a: { min: [0, 0, 0], max: [1, 1, 1] }, b: { min: [2, 0, 0], max: [3, 1, 1] } } as const;
  const specs = { a: { direction: [-1, 0, 0], distance: 2 }, b: { direction: [1, 0, 0], distance: 4 } } as const;

  it('is the union of the parts when assembled', () => {
    expect(explodedBounds(bounds, specs, 0)).toEqual({ min: [0, 0, 0], max: [3, 1, 1] });
  });

  it('grows as the parts move apart', () => {
    expect(explodedBounds(bounds, specs, 1)).toEqual({ min: [-2, 0, 0], max: [7, 1, 1] });
  });

  it('is null without parts', () => {
    expect(explodedBounds({}, {}, 1)).toBeNull();
  });
});

describe('compressor train layout', () => {
  it('has a spec and bounds for every sub-assembly', () => {
    for (const id of TRAIN_ASSEMBLY_IDS) {
      expect(COMPRESSOR_TRAIN_EXPLODE[id]).toBeDefined();
      expect(COMPRESSOR_TRAIN_BOUNDS[id].max[0]).toBeGreaterThan(COMPRESSOR_TRAIN_BOUNDS[id].min[0]);
    }
  });

  it('moves everything on the shaft along the shaft axis only', () => {
    for (const id of ['turbine', 'gearbox', 'coupling', 'rotor', 'bearing-de', 'bearing-nde'] as const) {
      const [, y, z] = explodeOffset(COMPRESSOR_TRAIN_EXPLODE[id], 1);

      expect([y, z]).toEqual([0, 0]);
    }
  });

  it('keeps the casing in place as the anchor', () => {
    expect(explodeOffset(COMPRESSOR_TRAIN_EXPLODE.casing, 1)).toEqual([0, 0, 0]);
  });

  it('never lets the rotor overtake the bearing it follows out of the casing', () => {
    for (let amount = 0; amount <= 1.001; amount += 0.05) {
      const rotor = explodeOffset(COMPRESSOR_TRAIN_EXPLODE.rotor, amount)[0];
      const bearing = explodeOffset(COMPRESSOR_TRAIN_EXPLODE['bearing-nde'], amount)[0];

      expect(bearing).toBeLessThanOrEqual(rotor);
    }
  });

  it('pulls the rotor clear of the casing at full explosion', () => {
    const rotorMax = COMPRESSOR_TRAIN_BOUNDS.rotor.max[0] + explodeOffset(COMPRESSOR_TRAIN_EXPLODE.rotor, 1)[0];
    const firstImpellerClear = -3.1 + 1 + explodeOffset(COMPRESSOR_TRAIN_EXPLODE.rotor, 1)[0];

    expect(firstImpellerClear).toBeLessThan(COMPRESSOR_TRAIN_BOUNDS.casing.min[0]);
    expect(rotorMax).toBeLessThan(COMPRESSOR_TRAIN_BOUNDS.casing.max[0]);
  });

  it('keeps the drive train in order: turbine furthest, then gearbox, then coupling', () => {
    const at = (id: 'turbine' | 'gearbox' | 'coupling') => explodeOffset(COMPRESSOR_TRAIN_EXPLODE[id], 1)[0];

    expect(at('turbine')).toBeGreaterThan(at('gearbox'));
    expect(at('gearbox')).toBeGreaterThan(at('coupling'));
  });

  it('mounts every measurement point on a real sub-assembly, inside or just above its bounds', () => {
    for (const point of Object.values(TRAIN_MEASUREMENT_POINTS)) {
      const box = COMPRESSOR_TRAIN_BOUNDS[point.assemblyId];

      expect(isTrainAssemblyId(point.assemblyId)).toBe(true);
      expect(point.position[0]).toBeGreaterThanOrEqual(box.min[0]);
      expect(point.position[0]).toBeLessThanOrEqual(box.max[0]);
    }
  });

  it('recognises its ids', () => {
    expect(isTrainAssemblyId('rotor')).toBe(true);
    expect(isTrainAssemblyId('train')).toBe(false);
  });
});
