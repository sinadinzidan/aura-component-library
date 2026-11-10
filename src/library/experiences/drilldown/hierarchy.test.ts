import { FIXTURE_INPUT, fixtureTree } from './drilldownFixture';
import {
  buildHierarchy,
  childSummary,
  descendantsAt,
  equipmentStatus,
  formatPath,
  groupStatus,
  leafCount,
  levelIndex,
  limitProximity,
  pathTo,
  sensorStatus,
  worstTone,
} from './hierarchy';
import type { HierarchySensor } from './hierarchy';

const SENSOR: HierarchySensor = {
  id: 's',
  tag: '23-PT-1',
  name: 'Pressure',
  assetId: 'a',
  unit: 'barg',
  value: 46,
  lowLimit: 40,
  highLimit: 52,
  highHighLimit: 55,
  rangeMin: 0,
  rangeMax: 60,
  decimals: 1,
  quality: 'good',
};

describe(buildHierarchy.name, () => {
  it('maps asset depth to site, area and equipment and hangs sensors under their asset', () => {
    const tree = fixtureTree();

    expect(tree.root.level).toBe('site');
    expect(tree.root.children.map((area) => area.level)).toEqual(['area', 'area']);
    expect(tree.byId.get('comp-1')?.level).toBe('equipment');
    expect(tree.byId.get('comp-1')?.children.map((sensor) => sensor.id)).toEqual(['pt', 'tt']);
    expect(tree.byId.get('pt')?.level).toBe('sensor');
  });

  it('indexes every node by id', () => {
    const tree = fixtureTree();

    expect(tree.byId.size).toBe(FIXTURE_INPUT.assets.length + FIXTURE_INPUT.sensors.length);
  });

  it('counts open alarms on the tag for a sensor and on the asset for equipment', () => {
    const tree = fixtureTree();

    expect(tree.byId.get('tt')?.metrics.openAlarms).toBe(1);
    expect(tree.byId.get('lt')?.metrics.openAlarms).toBe(0);
    expect(tree.byId.get('comp-3')?.metrics.openAlarms).toBe(1);
  });

  it('rolls metrics up to areas and the site as the sum of the children', () => {
    const tree = fixtureTree();

    expect(tree.byId.get('area-b')?.metrics.downtimeHours).toBe(47);
    expect(tree.root.metrics.downtimeHours).toBe(49);
    expect(tree.root.metrics.openAlarms).toBe(2);
    expect(tree.byId.get('area-b')?.metrics.healthDeficit).toBe(28 + 59);
  });

  it('collects alarms upwards, newest first', () => {
    const tree = fixtureTree();

    expect(tree.root.alarms.map((alarm) => alarm.id)).toEqual(['a1', 'a2', 'a3']);
    expect(tree.byId.get('area-a')?.alarms.map((alarm) => alarm.id)).toEqual(['a3']);
  });

  it('gives a sensor its reading, limits and trend', () => {
    const node = fixtureTree().byId.get('pt');

    expect(node?.reading).toMatchObject({ value: 48.6, unit: 'barg', limits: { low: 40, high: 52, highHigh: 55 } });
    expect(node?.figure).toMatchObject({ label: 'Discharge pressure', value: 48.6, tone: 'neutral' });
    expect(node?.series).toHaveLength(3);
  });

  it('leads assets with their health score', () => {
    const node = fixtureTree().byId.get('comp-1');

    expect(node?.figure).toEqual({ label: 'Health', value: 72, unit: '%', decimals: 0, tone: 'warning' });
  });

  it('derives the state of a group from its children', () => {
    const tree = fixtureTree();

    expect(tree.byId.get('area-a')?.status).toEqual({ tone: 'neutral', label: 'Normal', shape: 'dot' });
    expect(tree.byId.get('area-b')?.status).toEqual({ tone: 'critical', label: '2 of 2 need attention', shape: 'diamond' });
  });

  it('prints no value for a sensor with a bad signal', () => {
    const tree = buildHierarchy({ ...FIXTURE_INPUT, sensors: [{ ...SENSOR, assetId: 'sep', quality: 'bad' }] });

    expect(tree.byId.get('s')?.reading?.value).toBeNull();
    expect(tree.byId.get('s')?.metrics.healthDeficit).toBe(100);
  });

  it('can start from another root', () => {
    const tree = buildHierarchy({ ...FIXTURE_INPUT, rootId: 'area-b' });

    expect(tree.root.tag).toBe('NK-23');
    expect(tree.root.parentId).toBeNull();
  });

  it('throws without a root asset', () => {
    expect(() => buildHierarchy({ assets: [], sensors: [] })).toThrow('no root asset');
  });
});

describe(sensorStatus.name, () => {
  it('is neutral inside the limits', () => {
    expect(sensorStatus(SENSOR)).toEqual({ tone: 'neutral', label: 'Normal', shape: 'dot' });
  });

  it('warns above the high limit and below the low limit', () => {
    expect(sensorStatus({ ...SENSOR, value: 53 }).label).toBe('Above high limit');
    expect(sensorStatus({ ...SENSOR, value: 38 })).toMatchObject({ tone: 'warning', label: 'Below low limit' });
  });

  it('is critical at the trip limit', () => {
    expect(sensorStatus({ ...SENSOR, value: 55 })).toEqual({ tone: 'critical', label: 'Trip limit exceeded', shape: 'diamond' });
  });

  it('puts a bad signal before everything else', () => {
    expect(sensorStatus({ ...SENSOR, value: 60, quality: 'bad' }).label).toBe('Bad signal');
  });

  it('follows an open alarm when the value itself is back inside the limits', () => {
    expect(sensorStatus(SENSOR, [{ severity: 'high' }])).toMatchObject({ tone: 'warning', label: 'In alarm' });
    expect(sensorStatus(SENSOR, [{ severity: 'critical' }]).tone).toBe('critical');
    expect(sensorStatus(SENSOR, [{ severity: 'low' }]).tone).toBe('neutral');
  });

  it('flags an uncertain signal', () => {
    expect(sensorStatus({ ...SENSOR, quality: 'uncertain' })).toEqual({ tone: 'warning', label: 'Uncertain signal', shape: 'ring' });
  });
});

describe(equipmentStatus.name, () => {
  it('keeps normal run states neutral, told apart by shape', () => {
    expect(equipmentStatus({ state: 'running', health: 'good' })).toEqual({ tone: 'neutral', label: 'Running', shape: 'dot' });
    expect(equipmentStatus({ state: 'standby', health: 'good' })).toEqual({ tone: 'neutral', label: 'Standby', shape: 'ring' });
    expect(equipmentStatus({ state: 'stopped', health: 'good' }).shape).toBe('square');
  });

  it('colours a trip, poor health, maintenance and a watch', () => {
    expect(equipmentStatus({ state: 'tripped', health: 'good' })).toMatchObject({ tone: 'critical', label: 'Tripped' });
    expect(equipmentStatus({ state: 'running', health: 'poor' })).toMatchObject({ tone: 'critical', label: 'Running, poor health' });
    expect(equipmentStatus({ state: 'maintenance', health: 'watch' })).toMatchObject({ tone: 'warning', label: 'Maintenance' });
    expect(equipmentStatus({ state: 'running', health: 'watch' })).toMatchObject({ tone: 'warning', label: 'Running, watch' });
  });
});

describe(groupStatus.name, () => {
  it('counts only abnormal children', () => {
    const status = groupStatus([
      { status: { tone: 'neutral', label: 'Running', shape: 'dot' } },
      { status: { tone: 'warning', label: 'Maintenance', shape: 'square' } },
      { status: { tone: 'neutral', label: 'Standby', shape: 'ring' } },
    ]);

    expect(status).toEqual({ tone: 'warning', label: '1 of 3 need attention', shape: 'square' });
  });
});

describe(limitProximity.name, () => {
  it('is 0 in the middle of the band and 100 on a limit', () => {
    expect(limitProximity(50, 40, 60)).toBe(0);
    expect(limitProximity(60, 40, 60)).toBe(100);
    expect(limitProximity(45, 40, 60)).toBe(50);
  });

  it('stays at 100 beyond a limit and is 0 for an empty band', () => {
    expect(limitProximity(90, 40, 60)).toBe(100);
    expect(limitProximity(5, 10, 10)).toBe(0);
  });
});

describe(worstTone.name, () => {
  it('returns the most severe tone, neutral for none', () => {
    expect(worstTone(['neutral', 'warning', 'info'])).toBe('warning');
    expect(worstTone(['warning', 'critical'])).toBe('critical');
    expect(worstTone([])).toBe('neutral');
  });
});

describe('tree helpers', () => {
  it('returns the path from the root to a node', () => {
    expect(pathTo(fixtureTree(), 'pt').map((node) => node.id)).toEqual(['site', 'area-b', 'comp-1', 'pt']);
  });

  it('returns an empty path for an unknown id', () => {
    expect(pathTo(fixtureTree(), 'nope')).toEqual([]);
  });

  it('lists the descendants at a level', () => {
    const tree = fixtureTree();

    expect(descendantsAt(tree.root, 'equipment').map((node) => node.id)).toEqual(['sep', 'comp-1', 'comp-3']);
    expect(descendantsAt(tree.byId.get('area-b') ?? tree.root, 'sensor').map((node) => node.id)).toEqual(['pt', 'tt', 'vt']);
  });

  it('counts leaves, with a childless node as one', () => {
    const tree = fixtureTree();

    expect(leafCount(tree.root)).toBe(4);
    expect(leafCount(tree.byId.get('pt') ?? tree.root)).toBe(1);
  });

  it('formats a path of tags', () => {
    expect(formatPath(pathTo(fixtureTree(), 'comp-1'))).toBe('NK / NK-23 / 23-KA-9101');
  });

  it('orders the levels', () => {
    expect(levelIndex('site')).toBe(0);
    expect(levelIndex('sensor')).toBe(3);
  });

  it('summarises what sits under a node', () => {
    const tree = fixtureTree();

    expect(childSummary(tree.root)).toBe('2 areas');
    expect(childSummary(tree.byId.get('area-b') ?? tree.root)).toBe('2 equipment');
    expect(childSummary(tree.byId.get('comp-3') ?? tree.root)).toBe('1 sensor');
    expect(childSummary(tree.byId.get('vt') ?? tree.root)).toBe('Measurement');
  });
});
