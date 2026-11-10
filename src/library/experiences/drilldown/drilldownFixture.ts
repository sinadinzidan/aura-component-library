import { buildHierarchy } from './hierarchy';
import type { DrillTree, HierarchyInput } from './hierarchy';

/** A small plant used by the tests in this folder: one site, two areas, three machines, four sensors. */
export const FIXTURE_NOW = Date.UTC(2026, 2, 12, 14, 0, 0);

export const FIXTURE_INPUT: HierarchyInput = {
  assets: [
    { id: 'site', tag: 'NK', name: 'Nordkapp plant', type: 'site', parentId: null, state: 'running', health: 'good', healthScore: 91 },
    { id: 'area-a', tag: 'NK-20', name: 'Inlet and separation', type: 'area', parentId: 'site', state: 'running', health: 'good', healthScore: 94 },
    { id: 'area-b', tag: 'NK-23', name: 'Gas compression', type: 'area', parentId: 'site', state: 'running', health: 'watch', healthScore: 78 },
    { id: 'sep', tag: '20-VA-1001', name: 'Inlet separator', type: 'separator', parentId: 'area-a', state: 'running', health: 'good', healthScore: 95 },
    { id: 'comp-1', tag: '23-KA-9101', name: '1st stage compressor', type: 'compressor', parentId: 'area-b', state: 'running', health: 'watch', healthScore: 72 },
    { id: 'comp-3', tag: '23-KA-9103', name: 'Recompressor', type: 'compressor', parentId: 'area-b', state: 'tripped', health: 'poor', healthScore: 41 },
  ],
  sensors: [
    { id: 'lt', tag: '20-LT-10012', name: 'Separator level', assetId: 'sep', unit: '%', value: 50, lowLimit: 30, highLimit: 70, highHighLimit: 85, rangeMin: 0, rangeMax: 100, decimals: 1, quality: 'good' },
    { id: 'pt', tag: '23-PT-92531', name: 'Discharge pressure', assetId: 'comp-1', unit: 'barg', value: 48.6, lowLimit: 40, highLimit: 52, highHighLimit: 55, rangeMin: 0, rangeMax: 60, decimals: 1, quality: 'good' },
    { id: 'tt', tag: '23-TT-92532', name: 'Discharge temperature', assetId: 'comp-1', unit: '°C', value: 146.3, lowLimit: 90, highLimit: 145, highHighLimit: 155, rangeMin: 0, rangeMax: 180, decimals: 1, quality: 'good' },
    { id: 'vt', tag: '23-VT-92740', name: 'Drive-end vibration', assetId: 'comp-3', unit: 'mm/s', value: 11.6, lowLimit: 0, highLimit: 7.1, highHighLimit: 11, rangeMin: 0, rangeMax: 15, decimals: 1, quality: 'good' },
  ],
  alarms: [
    { id: 'a1', severity: 'critical', message: 'Recompressor tripped on high vibration', sensorTag: '23-VT-92740', assetId: 'comp-3', state: 'active', raisedAt: FIXTURE_NOW - 840_000, value: '11.6 mm/s', limit: '11.0 mm/s' },
    { id: 'a2', severity: 'high', message: 'Discharge temperature high', sensorTag: '23-TT-92532', assetId: 'comp-1', state: 'active', raisedAt: FIXTURE_NOW - 2_280_000, value: '146.3 °C', limit: '145.0 °C' },
    { id: 'a3', severity: 'low', message: 'Separator level deviation', sensorTag: '20-LT-10012', assetId: 'sep', state: 'cleared', raisedAt: FIXTURE_NOW - 75_600_000, value: '71.2 %', limit: '70.0 %' },
  ],
  metrics: {
    sep: { downtimeHours: 2 },
    'comp-1': { downtimeHours: 6 },
    'comp-3': { downtimeHours: 41 },
    pt: { downtimeHours: 1 },
  },
  series: {
    pt: [
      { t: FIXTURE_NOW - 7_200_000, v: 47.9 },
      { t: FIXTURE_NOW - 3_600_000, v: 48.2 },
      { t: FIXTURE_NOW, v: 48.6 },
    ],
    'comp-1': [
      { t: FIXTURE_NOW - 3_600_000, v: 74 },
      { t: FIXTURE_NOW, v: 72 },
    ],
  },
};

export function fixtureTree(): DrillTree {
  return buildHierarchy(FIXTURE_INPUT);
}
