import { assemblyLeafIds } from '../models/assemblyTree';
import { explodeOffset } from '../models/explodeOffsets';

import { VIEWER_BOUNDS, VIEWER_EXPLODE, VIEWER_PARTS, VIEWER_TREE, findPart, partBounds, partIdsInSystems, systemOf } from './viewerModel';

describe('VIEWER_PARTS', () => {
  it('has unique ids and tags', () => {
    expect(new Set(VIEWER_PARTS.map((part) => part.id)).size).toBe(VIEWER_PARTS.length);
    expect(new Set(VIEWER_PARTS.map((part) => part.tag)).size).toBe(VIEWER_PARTS.length);
  });

  it('covers every system', () => {
    expect(new Set(VIEWER_PARTS.map((part) => part.system)).size).toBe(5);
  });

  it('has an explode spec for every part', () => {
    for (const part of VIEWER_PARTS) expect(VIEWER_EXPLODE[part.id]).toBeDefined();
  });
});

describe('bounds', () => {
  it('measures each shape', () => {
    expect(partBounds(VIEWER_PARTS[0])).toEqual({ min: [-9, 0, -3.7], max: [9, 0.5, 3.7] });
    const separator = findPart('separator');
    expect(separator && partBounds(separator).max[2]).toBeCloseTo(-1.8 + 1.2);
    const scrubber = findPart('scrubber');
    expect(scrubber && partBounds(scrubber).max[1]).toBeCloseTo(0.5 + 3.2);
  });

  it('contains every part', () => {
    for (const part of VIEWER_PARTS) {
      const box = partBounds(part);
      for (let axis = 0; axis < 3; axis += 1) {
        expect(box.min[axis]).toBeGreaterThanOrEqual(VIEWER_BOUNDS.min[axis] - 1e-9);
        expect(box.max[axis]).toBeLessThanOrEqual(VIEWER_BOUNDS.max[axis] + 1e-9);
      }
    }
  });
});

describe('VIEWER_TREE', () => {
  it('has every part as a leaf exactly once', () => {
    const leaves = assemblyLeafIds(VIEWER_TREE, 'module');
    expect([...leaves].sort()).toEqual(VIEWER_PARTS.map((part) => part.id).sort());
  });

  it('groups parts by system', () => {
    expect(assemblyLeafIds(VIEWER_TREE, 'sys-compression').sort()).toEqual(['compressor', 'motor']);
  });
});

describe('helpers', () => {
  it('finds parts and their systems', () => {
    expect(findPart('motor')?.name).toBe('Drive motor');
    expect(findPart('nope')).toBeUndefined();
    expect(systemOf('cooler')).toBe('cooling');
    expect(partIdsInSystems(['separation']).sort()).toEqual(['scrubber', 'separator']);
  });

  it('moves parts when exploded', () => {
    expect(explodeOffset(VIEWER_EXPLODE.motor, 1)[0]).toBeGreaterThan(0);
  });
});
