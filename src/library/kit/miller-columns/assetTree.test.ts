import { describe, expect, it } from 'vitest';

import {
  buildAssetTree,
  childSummary,
  groupState,
  leafCount,
  limitProximity,
  nodesAt,
  pathTo,
  sensorState,
  unitState,
  type TreeAlarm,
  type TreeAsset,
  type TreeSensor,
} from './assetTree';

describe(buildAssetTree.name, () => {
  it('assigns levels by depth and hangs sensors under units', () => {
    const tree = buildAssetTree({ assets: ASSETS, sensors: SENSORS, alarms: ALARMS });

    expect(tree.root.level).toBe('site');
    expect(tree.byId.get('a1')?.level).toBe('area');
    expect(tree.byId.get('u1')?.level).toBe('unit');
    expect(tree.byId.get('u1')?.children.map((node) => node.id)).toEqual(['s1', 's2']);
    expect(tree.byId.get('s1')?.level).toBe('tag');
  });

  it('honours a custom level list', () => {
    const tree = buildAssetTree({ assets: ASSETS, sensors: SENSORS, levels: ['fleet', 'site', 'unit'] });

    expect(tree.root.level).toBe('fleet');
    expect(tree.byId.get('u1')?.level).toBe('unit');
  });

  it('rolls state and alarms up to groups', () => {
    const tree = buildAssetTree({ assets: ASSETS, sensors: SENSORS, alarms: ALARMS });

    expect(tree.byId.get('a1')).toMatchObject({ tone: 'critical', stateLabel: '1 of 2 need attention', openAlarms: 1 });
    expect(tree.root.alarms.map((alarm) => alarm.id)).toEqual(['x2', 'x1']);
  });

  it('throws without a root asset', () => {
    expect(() => buildAssetTree({ assets: [], sensors: [] })).toThrow('no root asset');
  });
});

describe('states', () => {
  it('judges a sensor by quality, limits and open alarms', () => {
    expect(sensorState(sensor({ quality: 'bad' }))).toEqual({ tone: 'critical', label: 'Bad signal' });
    expect(sensorState(sensor({ value: 12 }))).toEqual({ tone: 'critical', label: 'Trip limit exceeded' });
    expect(sensorState(sensor({ value: 9 }))).toEqual({ tone: 'warning', label: 'Above high limit' });
    expect(sensorState(sensor({ value: 1 }))).toEqual({ tone: 'warning', label: 'Below low limit' });
    expect(sensorState(sensor({}), [{ severity: 'critical' }])).toEqual({ tone: 'critical', label: 'In alarm' });
    expect(sensorState(sensor({}), [{ severity: 'high' }])).toEqual({ tone: 'warning', label: 'In alarm' });
    expect(sensorState(sensor({ quality: 'uncertain' }))).toEqual({ tone: 'warning', label: 'Uncertain signal' });
    expect(sensorState(sensor({}))).toEqual({ tone: 'success', label: 'Normal' });
  });

  it('judges a unit by run state and health', () => {
    expect(unitState({ state: 'tripped', health: 'good' }).tone).toBe('critical');
    expect(unitState({ state: 'running', health: 'poor' }).label).toBe('Poor health');
    expect(unitState({ state: 'maintenance', health: 'good' }).tone).toBe('warning');
    expect(unitState({ state: 'running', health: 'watch' }).label).toBe('Watch');
    expect(unitState({ state: 'standby', health: 'good' }).tone).toBe('info');
    expect(unitState({ state: 'stopped', health: 'good' }).tone).toBe('neutral');
    expect(unitState({ state: 'running', health: 'good' })).toEqual({ tone: 'success', label: 'Running' });
  });

  it('summarises a group by its worst child', () => {
    expect(groupState([{ tone: 'success' }, { tone: 'info' }])).toEqual({ tone: 'success', label: 'Normal' });
    expect(groupState([{ tone: 'warning' }, { tone: 'critical' }, { tone: 'success' }])).toEqual({ tone: 'critical', label: '2 of 3 need attention' });
  });

  it('measures how close a value is to its limits', () => {
    expect(limitProximity(5, 0, 10)).toBe(0);
    expect(limitProximity(10, 0, 10)).toBe(100);
    expect(limitProximity(7.5, 0, 10)).toBe(50);
    expect(limitProximity(3, 4, 4)).toBe(0);
  });
});

describe('queries', () => {
  const tree = buildAssetTree({ assets: ASSETS, sensors: SENSORS, alarms: ALARMS });

  it('finds the path to a node', () => {
    expect(pathTo(tree, 's2').map((node) => node.id)).toEqual(['root', 'a1', 'u1', 's2']);
    expect(pathTo(tree, 'missing')).toEqual([]);
  });

  it('collects nodes at a level and counts leaves', () => {
    expect(nodesAt(tree.root, 'unit').map((node) => node.id)).toEqual(['u1', 'u2']);
    expect(leafCount(tree.root)).toBe(3);
  });

  it('describes what sits under a node', () => {
    expect(childSummary(tree.root)).toBe('1 area');
    expect(childSummary(node(tree.byId.get('u1')))).toBe('2 tags');
    expect(childSummary(node(tree.byId.get('u2')))).toBe('Nothing below');
    expect(childSummary(node(tree.byId.get('s1')))).toBe('Measurement');
  });
});

function node<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('missing node');
  return value;
}

function sensor(overrides: Partial<TreeSensor>): TreeSensor {
  return { id: 's', tag: 'S', name: 'Sensor', assetId: 'u1', unit: 'bar', value: 5, lowLimit: 2, highLimit: 8, highHighLimit: 11, rangeMin: 0, rangeMax: 12, decimals: 1, quality: 'good', seed: 1, ...overrides };
}

const ASSETS: TreeAsset[] = [
  { id: 'root', tag: 'R', name: 'Plant', type: 'site', parentId: null, state: 'running', health: 'good', healthScore: 90 },
  { id: 'a1', tag: 'A1', name: 'Area', type: 'area', parentId: 'root', state: 'running', health: 'good', healthScore: 80 },
  { id: 'u1', tag: 'U1', name: 'Pump', type: 'pump', parentId: 'a1', state: 'tripped', health: 'poor', healthScore: 40 },
  { id: 'u2', tag: 'U2', name: 'Valve', type: 'valve', parentId: 'a1', state: 'running', health: 'good', healthScore: 95 },
];

const SENSORS: TreeSensor[] = [sensor({ id: 's1', tag: 'S1' }), sensor({ id: 's2', tag: 'S2', value: 9 })];

const ALARMS: TreeAlarm[] = [
  { id: 'x1', severity: 'high', message: 'High', sensorTag: 'S2', assetId: 'u1', state: 'active', raisedAt: 10, value: '9', limit: '8' },
  { id: 'x2', severity: 'low', message: 'Old', sensorTag: 'S1', assetId: 'u1', state: 'cleared', raisedAt: 20, value: '5', limit: '8' },
];
