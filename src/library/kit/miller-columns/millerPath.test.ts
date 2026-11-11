import { describe, expect, it } from 'vitest';

import { buildAssetTree, type TreeAsset, type TreeSensor } from './assetTree';
import { activeNode, millerColumns, movePath, sanitizePath, selectNode } from './millerPath';

describe('miller path', () => {
  it('drops ids that do not follow from their parent', () => {
    expect(sanitizePath(TREE, ['a1', 'u9', 's1'])).toEqual(['a1']);
    expect(sanitizePath(TREE, ['nope'])).toEqual([]);
  });

  it('lists one column per selected level and one for the children', () => {
    const columns = millerColumns(TREE, ['a1', 'u1']);

    expect(columns.map((column) => column.parent.id)).toEqual(['root', 'a1', 'u1']);
    expect(columns.map((column) => column.selectedId)).toEqual(['a1', 'u1', null]);
    expect(columns[2]?.nodes.map((node) => node.id)).toEqual(['s1']);
  });

  it('adds no column below a leaf', () => {
    expect(millerColumns(TREE, ['a1', 'u1', 's1'])).toHaveLength(3);
    expect(millerColumns(TREE, ['a2'])).toHaveLength(1);
    expect(millerColumns(TREE, [])).toHaveLength(1);
  });

  it('resolves the active node', () => {
    expect(activeNode(TREE, ['a1', 'u1']).id).toBe('u1');
    expect(activeNode(TREE, []).id).toBe('root');
  });

  it('builds the selection for a node', () => {
    expect(selectNode(TREE, 's1')).toEqual(['a1', 'u1', 's1']);
    expect(selectNode(TREE, 'missing')).toEqual([]);
  });

  it('moves within a column and stops at its ends', () => {
    expect(movePath(TREE, ['a1'], 'down')).toEqual(['a2']);
    expect(movePath(TREE, ['a2'], 'down')).toEqual(['a2']);
    expect(movePath(TREE, ['a2'], 'up')).toEqual(['a1']);
    expect(movePath(TREE, ['a1', 'u1'], 'end')).toEqual(['a1', 'u2']);
    expect(movePath(TREE, ['a1', 'u2'], 'home')).toEqual(['a1', 'u1']);
  });

  it('opens a column and steps back out', () => {
    expect(movePath(TREE, ['a1'], 'right')).toEqual(['a1', 'u1']);
    expect(movePath(TREE, ['a1', 'u1', 's1'], 'right')).toEqual(['a1', 'u1', 's1']);
    expect(movePath(TREE, ['a1', 'u1'], 'left')).toEqual(['a1']);
    expect(movePath(TREE, ['a1'], 'left')).toEqual(['a1']);
  });

  it('selects the first row when nothing is selected', () => {
    expect(movePath(TREE, [], 'down')).toEqual(['a1']);
    expect(movePath(TREE, [], 'left')).toEqual([]);
  });
});

const ASSETS: TreeAsset[] = [
  { id: 'root', tag: 'R', name: 'Plant', type: 'site', parentId: null, state: 'running', health: 'good', healthScore: 90 },
  { id: 'a1', tag: 'A1', name: 'Area one', type: 'area', parentId: 'root', state: 'running', health: 'good', healthScore: 80 },
  { id: 'a2', tag: 'A2', name: 'Area two', type: 'area', parentId: 'root', state: 'running', health: 'good', healthScore: 85 },
  { id: 'u1', tag: 'U1', name: 'Pump', type: 'pump', parentId: 'a1', state: 'running', health: 'good', healthScore: 91 },
  { id: 'u2', tag: 'U2', name: 'Valve', type: 'valve', parentId: 'a1', state: 'running', health: 'good', healthScore: 95 },
];

const SENSORS: TreeSensor[] = [
  { id: 's1', tag: 'S1', name: 'Pressure', assetId: 'u1', unit: 'bar', value: 5, lowLimit: 2, highLimit: 8, rangeMin: 0, rangeMax: 10, decimals: 1, quality: 'good', seed: 1 },
];

const TREE = buildAssetTree({ assets: ASSETS, sensors: SENSORS });
