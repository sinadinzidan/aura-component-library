import { assemblyLeafIds, assemblyPartCount, assemblyPath, findAssembly, flattenAssemblies, isAssemblyActive } from './assemblyTree';
import type { AssemblyNode } from './assemblyTree';
import { COMPRESSOR_TRAIN_TREE, TRAIN_ASSEMBLY_IDS } from './compressorTrainLayout';

const TREE: AssemblyNode = {
  id: 'machine',
  name: 'Machine',
  children: [
    { id: 'drive', name: 'Drive', children: [{ id: 'motor', name: 'Motor' }, { id: 'coupling', name: 'Coupling' }] },
    { id: 'pump', name: 'Pump', children: [{ id: 'casing', name: 'Casing' }] },
    { id: 'frame', name: 'Frame' },
  ],
};

describe(flattenAssemblies.name, () => {
  it('lists parents before their children with depth and parent', () => {
    const rows = flattenAssemblies(TREE);

    expect(rows.map((row) => row.node.id)).toEqual(['machine', 'drive', 'motor', 'coupling', 'pump', 'casing', 'frame']);
    expect(rows.map((row) => row.depth)).toEqual([0, 1, 2, 2, 1, 2, 1]);
    expect(rows[2].parentId).toBe('drive');
    expect(rows[0].parentId).toBeNull();
  });
});

describe(findAssembly.name, () => {
  it('finds a nested node', () => {
    expect(findAssembly(TREE, 'casing')?.name).toBe('Casing');
  });

  it('returns undefined for an unknown id', () => {
    expect(findAssembly(TREE, 'nope')).toBeUndefined();
  });
});

describe(assemblyPath.name, () => {
  it('returns the nodes from the root to the id', () => {
    expect(assemblyPath(TREE, 'coupling').map((node) => node.id)).toEqual(['machine', 'drive', 'coupling']);
  });

  it('returns only the root for the root', () => {
    expect(assemblyPath(TREE, 'machine').map((node) => node.id)).toEqual(['machine']);
  });

  it('is empty for an unknown id', () => {
    expect(assemblyPath(TREE, 'nope')).toEqual([]);
  });
});

describe(assemblyLeafIds.name, () => {
  it('returns the leaves under a group', () => {
    expect(assemblyLeafIds(TREE, 'drive')).toEqual(['motor', 'coupling']);
  });

  it('returns a leaf itself', () => {
    expect(assemblyLeafIds(TREE, 'frame')).toEqual(['frame']);
  });

  it('returns every leaf for the root', () => {
    expect(assemblyLeafIds(TREE, 'machine')).toEqual(['motor', 'coupling', 'casing', 'frame']);
  });

  it('is empty for an unknown id', () => {
    expect(assemblyLeafIds(TREE, 'nope')).toEqual([]);
  });
});

describe(isAssemblyActive.name, () => {
  it('keeps everything active when nothing is selected', () => {
    expect(isAssemblyActive(TREE, null, 'motor')).toBe(true);
  });

  it('keeps everything active when the root is selected', () => {
    expect(isAssemblyActive(TREE, 'machine', 'casing')).toBe(true);
  });

  it('keeps only the leaves of the selected group active', () => {
    expect(isAssemblyActive(TREE, 'drive', 'motor')).toBe(true);
    expect(isAssemblyActive(TREE, 'drive', 'casing')).toBe(false);
  });

  it('isolates a single leaf', () => {
    expect(isAssemblyActive(TREE, 'casing', 'casing')).toBe(true);
    expect(isAssemblyActive(TREE, 'casing', 'frame')).toBe(false);
  });

  it('ignores an unknown selection', () => {
    expect(isAssemblyActive(TREE, 'nope', 'frame')).toBe(true);
  });
});

describe(assemblyPartCount.name, () => {
  it('counts the drawable parts under a node', () => {
    expect(assemblyPartCount(TREE)).toBe(4);
    expect(assemblyPartCount({ id: 'x', name: 'X' })).toBe(1);
  });
});

describe('COMPRESSOR_TRAIN_TREE', () => {
  it('has exactly the drawable sub-assemblies as leaves', () => {
    expect([...assemblyLeafIds(COMPRESSOR_TRAIN_TREE, 'train')].sort()).toEqual([...TRAIN_ASSEMBLY_IDS].sort());
  });

  it('uses unique ids', () => {
    const ids = flattenAssemblies(COMPRESSOR_TRAIN_TREE).map((row) => row.node.id);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
