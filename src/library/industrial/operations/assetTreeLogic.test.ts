import { ASSET_TREE_ROOT, filterAssetTree, indexAssetTree, pathTo, rollUp, siblingsOf } from './assetTreeLogic';
import type { AssetTreeInput } from './assetTreeLogic';

describe('assetTree', () => {
  it('indexes a flat list under a hidden root', () => {
    const index = indexAssetTree(ASSETS);

    expect(index[ASSET_TREE_ROOT].children).toEqual(['plant']);
    expect(index.plant.children).toEqual(['compression', 'export']);
    expect(index.compression.children).toEqual(['ka-1', 'ka-2']);
  });

  it('puts an asset with an unknown parent at the top level', () => {
    const index = indexAssetTree([{ id: 'orphan', tag: 'X-1', name: 'Orphan', parentId: 'missing' }]);

    expect(index[ASSET_TREE_ROOT].children).toEqual(['orphan']);
  });

  it('rolls open alarms up to every ancestor', () => {
    const index = indexAssetTree(ASSETS);

    expect(rollUp(index, 'ka-1').alarms).toBe(2);
    expect(rollUp(index, 'compression').alarms).toBe(3);
    expect(rollUp(index, 'plant').alarms).toBe(4);
    expect(rollUp(index, 'export').alarms).toBe(1);
  });

  it('reports the worst severity below a node', () => {
    const index = indexAssetTree(ASSETS);

    expect(rollUp(index, 'compression').worstSeverity).toBe('critical');
    expect(rollUp(index, 'export').worstSeverity).toBe('low');
    expect(rollUp(index, 'pa-1').worstSeverity).toBeUndefined();
  });

  it('counts leaves and their run states', () => {
    const index = indexAssetTree(ASSETS);
    const plant = rollUp(index, 'plant');

    expect(plant.equipment).toBe(3);
    expect(plant.states).toEqual({ running: 2, standby: 0, stopped: 0, tripped: 1, maintenance: 0 });
  });

  it('reports the worst run state and health below a node', () => {
    const index = indexAssetTree(ASSETS);

    expect(rollUp(index, 'compression').worstState).toBe('tripped');
    expect(rollUp(index, 'compression').worstHealth).toBe('poor');
    expect(rollUp(index, 'export').worstState).toBe('running');
  });

  it('counts a leaf as one piece of equipment', () => {
    expect(rollUp(indexAssetTree(ASSETS), 'ka-1').equipment).toBe(1);
  });

  it('returns the path from the top level to a node', () => {
    const index = indexAssetTree(ASSETS);

    expect(pathTo(index, 'ka-2').map((node) => node.id)).toEqual(['plant', 'compression', 'ka-2']);
    expect(pathTo(index, 'nope')).toEqual([]);
  });

  it('finds the previous and next sibling', () => {
    const index = indexAssetTree(ASSETS);

    const first = siblingsOf(index, 'ka-1');
    expect(first.previous).toBeUndefined();
    expect(first.next?.id).toBe('ka-2');
    expect(first.position).toBe(1);
    expect(first.count).toBe(2);
    expect(siblingsOf(index, 'ka-2').previous?.id).toBe('ka-1');
  });

  it('keeps matches and the branches that lead to them when filtering', () => {
    const filtered = filterAssetTree(indexAssetTree(ASSETS), 'recomp');

    expect(filtered.matches).toBe(1);
    expect(Object.keys(filtered.index).sort()).toEqual(['compression', 'ka-2', 'plant', 'root']);
    expect(filtered.index.compression.children).toEqual(['ka-2']);
    expect(filtered.expanded.sort()).toEqual(['compression', 'plant']);
  });

  it('matches on the tag as well as the name', () => {
    expect(filterAssetTree(indexAssetTree(ASSETS), '27-pa').matches).toBe(1);
  });

  it('keeps everything for an empty query and nothing but the root for no match', () => {
    const index = indexAssetTree(ASSETS);

    expect(filterAssetTree(index, '  ').index).toBe(index);
    expect(filterAssetTree(index, 'zzz').matches).toBe(0);
    expect(filterAssetTree(index, 'zzz').index[ASSET_TREE_ROOT].children).toEqual([]);
  });
});

const ASSETS: readonly AssetTreeInput[] = [
  { id: 'plant', tag: 'NK', name: 'Nordkapp plant', parentId: null },
  { id: 'compression', tag: 'NK-23', name: 'Gas compression', parentId: 'plant', alarms: ['medium'] },
  { id: 'export', tag: 'NK-27', name: 'Gas export', parentId: 'plant', alarms: ['low'] },
  { id: 'ka-1', tag: '23-KA-9101', name: '1st stage compressor', parentId: 'compression', state: 'running', health: 'watch', alarms: ['high', 'critical'] },
  { id: 'ka-2', tag: '23-KA-9103', name: 'Recompressor', parentId: 'compression', state: 'tripped', health: 'poor' },
  { id: 'pa-1', tag: '27-PA-2001A', name: 'Export pump A', parentId: 'export', state: 'running', health: 'good' },
];
