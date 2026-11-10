import { DAY, HOUR, MINUTE, REFERENCE_NOW } from './series';

/**
 * One fictional plant shared by every industrial specimen: the Nordkapp gas processing plant.
 * Shapes follow CDF concepts (asset hierarchy, time series, events) so a picked component can be
 * wired to real data later. Use these records instead of inventing new names per specimen.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type RunState = 'running' | 'standby' | 'stopped' | 'tripped' | 'maintenance';
export type Health = 'good' | 'watch' | 'poor';

export type Site = { id: string; name: string; region: string };

export const SITES: readonly Site[] = [
  { id: 'nordkapp', name: 'Nordkapp', region: 'Norwegian Sea' },
  { id: 'valhall-sor', name: 'Valhall Sør', region: 'North Sea' },
  { id: 'hammerfest', name: 'Hammerfest LNG', region: 'Barents Sea' },
  { id: 'stord', name: 'Stord terminal', region: 'West coast' },
];

export type Asset = {
  id: string;
  /** Functional location tag. */
  tag: string;
  name: string;
  type: 'site' | 'area' | 'system' | 'compressor' | 'pump' | 'separator' | 'exchanger' | 'valve' | 'turbine';
  parentId: string | null;
  state: RunState;
  health: Health;
  /** 0–100. */
  healthScore: number;
  criticality: 'A' | 'B' | 'C';
};

export const ASSETS: readonly Asset[] = [
  { id: 'nk', tag: 'NK', name: 'Nordkapp plant', type: 'site', parentId: null, state: 'running', health: 'good', healthScore: 91, criticality: 'A' },
  { id: 'nk-20', tag: 'NK-20', name: 'Inlet and separation', type: 'area', parentId: 'nk', state: 'running', health: 'good', healthScore: 94, criticality: 'A' },
  { id: 'nk-23', tag: 'NK-23', name: 'Gas compression', type: 'area', parentId: 'nk', state: 'running', health: 'watch', healthScore: 78, criticality: 'A' },
  { id: 'nk-27', tag: 'NK-27', name: 'Gas export', type: 'area', parentId: 'nk', state: 'running', health: 'good', healthScore: 96, criticality: 'B' },
  { id: 'nk-40', tag: 'NK-40', name: 'Cooling water', type: 'system', parentId: 'nk', state: 'running', health: 'good', healthScore: 89, criticality: 'B' },
  { id: '20-va-1001', tag: '20-VA-1001', name: 'Inlet separator', type: 'separator', parentId: 'nk-20', state: 'running', health: 'good', healthScore: 95, criticality: 'A' },
  { id: '20-va-1002', tag: '20-VA-1002', name: 'Test separator', type: 'separator', parentId: 'nk-20', state: 'standby', health: 'good', healthScore: 92, criticality: 'C' },
  { id: '20-xv-1105', tag: '20-XV-1105', name: 'Inlet shutdown valve', type: 'valve', parentId: 'nk-20', state: 'running', health: 'good', healthScore: 97, criticality: 'A' },
  { id: '23-ka-9101', tag: '23-KA-9101', name: '1st stage compressor', type: 'compressor', parentId: 'nk-23', state: 'running', health: 'watch', healthScore: 72, criticality: 'A' },
  { id: '23-ka-9102', tag: '23-KA-9102', name: '2nd stage compressor', type: 'compressor', parentId: 'nk-23', state: 'running', health: 'good', healthScore: 88, criticality: 'A' },
  { id: '23-ka-9103', tag: '23-KA-9103', name: 'Recompressor', type: 'compressor', parentId: 'nk-23', state: 'tripped', health: 'poor', healthScore: 41, criticality: 'A' },
  { id: '23-ha-9114', tag: '23-HA-9114', name: 'Interstage cooler', type: 'exchanger', parentId: 'nk-23', state: 'running', health: 'watch', healthScore: 69, criticality: 'B' },
  { id: '23-gt-9001', tag: '23-GT-9001', name: 'Compressor gas turbine', type: 'turbine', parentId: 'nk-23', state: 'running', health: 'good', healthScore: 85, criticality: 'A' },
  { id: '27-pa-2001a', tag: '27-PA-2001A', name: 'Export pump A', type: 'pump', parentId: 'nk-27', state: 'running', health: 'good', healthScore: 93, criticality: 'B' },
  { id: '27-pa-2001b', tag: '27-PA-2001B', name: 'Export pump B', type: 'pump', parentId: 'nk-27', state: 'standby', health: 'good', healthScore: 90, criticality: 'B' },
  { id: '40-pa-4001', tag: '40-PA-4001', name: 'Cooling water pump', type: 'pump', parentId: 'nk-40', state: 'maintenance', health: 'watch', healthScore: 64, criticality: 'C' },
];

export type Sensor = {
  id: string;
  /** Instrument tag, also the time series external ID. */
  tag: string;
  name: string;
  assetId: string;
  unit: string;
  value: number;
  /** Operating limits. */
  lowLimit: number;
  highLimit: number;
  /** Trip limit above high, when one exists. */
  highHighLimit?: number;
  rangeMin: number;
  rangeMax: number;
  decimals: number;
  quality: 'good' | 'uncertain' | 'bad';
  /** Seed for `makeSeries`, so each tag has its own stable trend. */
  seed: number;
};

export const SENSORS: readonly Sensor[] = [
  { id: 'pt-92531', tag: '23-PT-92531', name: 'Discharge pressure', assetId: '23-ka-9101', unit: 'barg', value: 48.6, lowLimit: 40, highLimit: 52, highHighLimit: 55, rangeMin: 0, rangeMax: 60, decimals: 1, quality: 'good', seed: 11 },
  { id: 'pt-92530', tag: '23-PT-92530', name: 'Suction pressure', assetId: '23-ka-9101', unit: 'barg', value: 12.4, lowLimit: 10, highLimit: 15, rangeMin: 0, rangeMax: 20, decimals: 1, quality: 'good', seed: 12 },
  { id: 'tt-92532', tag: '23-TT-92532', name: 'Discharge temperature', assetId: '23-ka-9101', unit: '°C', value: 141.2, lowLimit: 90, highLimit: 145, highHighLimit: 155, rangeMin: 0, rangeMax: 180, decimals: 1, quality: 'good', seed: 13 },
  { id: 'vt-92540', tag: '23-VT-92540', name: 'Drive-end vibration', assetId: '23-ka-9101', unit: 'mm/s', value: 6.8, lowLimit: 0, highLimit: 7.1, highHighLimit: 11, rangeMin: 0, rangeMax: 15, decimals: 1, quality: 'good', seed: 14 },
  { id: 'st-92501', tag: '23-ST-92501', name: 'Shaft speed', assetId: '23-ka-9101', unit: 'rpm', value: 9840, lowLimit: 7000, highLimit: 10500, rangeMin: 0, rangeMax: 12000, decimals: 0, quality: 'good', seed: 15 },
  { id: 'ft-92510', tag: '23-FT-92510', name: 'Gas flow', assetId: '23-ka-9101', unit: 'Sm³/h', value: 182400, lowLimit: 120000, highLimit: 210000, rangeMin: 0, rangeMax: 250000, decimals: 0, quality: 'good', seed: 16 },
  { id: 'lt-10012', tag: '20-LT-10012', name: 'Separator level', assetId: '20-va-1001', unit: '%', value: 54.3, lowLimit: 30, highLimit: 70, highHighLimit: 85, rangeMin: 0, rangeMax: 100, decimals: 1, quality: 'good', seed: 17 },
  { id: 'pt-10010', tag: '20-PT-10010', name: 'Separator pressure', assetId: '20-va-1001', unit: 'barg', value: 13.1, lowLimit: 11, highLimit: 15, rangeMin: 0, rangeMax: 20, decimals: 1, quality: 'good', seed: 18 },
  { id: 'tt-91141', tag: '23-TT-91141', name: 'Cooler outlet temperature', assetId: '23-ha-9114', unit: '°C', value: 38.9, lowLimit: 20, highLimit: 40, highHighLimit: 45, rangeMin: 0, rangeMax: 60, decimals: 1, quality: 'uncertain', seed: 19 },
  { id: 'ft-20011', tag: '27-FT-20011', name: 'Export flow', assetId: '27-pa-2001a', unit: 'm³/h', value: 412, lowLimit: 300, highLimit: 480, rangeMin: 0, rangeMax: 600, decimals: 0, quality: 'good', seed: 20 },
  { id: 'it-20013', tag: '27-IT-20013', name: 'Motor current', assetId: '27-pa-2001a', unit: 'A', value: 86.2, lowLimit: 40, highLimit: 95, highHighLimit: 105, rangeMin: 0, rangeMax: 120, decimals: 1, quality: 'good', seed: 21 },
  { id: 'tt-40015', tag: '40-TT-40015', name: 'Bearing temperature', assetId: '40-pa-4001', unit: '°C', value: 0, lowLimit: 20, highLimit: 75, highHighLimit: 90, rangeMin: 0, rangeMax: 120, decimals: 1, quality: 'bad', seed: 22 },
];

export type Alarm = {
  id: string;
  severity: Severity;
  /** Alarm text as an operator would read it. */
  message: string;
  sensorTag: string;
  assetId: string;
  state: 'active' | 'acknowledged' | 'cleared' | 'shelved';
  raisedAt: number;
  value: string;
  limit: string;
};

export const ALARMS: readonly Alarm[] = [
  { id: 'alm-4812', severity: 'critical', message: 'Recompressor tripped on high vibration', sensorTag: '23-VT-92740', assetId: '23-ka-9103', state: 'active', raisedAt: REFERENCE_NOW - 14 * MINUTE, value: '11.6 mm/s', limit: '11.0 mm/s' },
  { id: 'alm-4811', severity: 'high', message: 'Discharge temperature high', sensorTag: '23-TT-92532', assetId: '23-ka-9101', state: 'active', raisedAt: REFERENCE_NOW - 38 * MINUTE, value: '146.3 °C', limit: '145.0 °C' },
  { id: 'alm-4809', severity: 'high', message: 'Drive-end vibration approaching limit', sensorTag: '23-VT-92540', assetId: '23-ka-9101', state: 'acknowledged', raisedAt: REFERENCE_NOW - 2 * HOUR, value: '6.8 mm/s', limit: '7.1 mm/s' },
  { id: 'alm-4806', severity: 'medium', message: 'Cooler outlet temperature high', sensorTag: '23-TT-91141', assetId: '23-ha-9114', state: 'acknowledged', raisedAt: REFERENCE_NOW - 5 * HOUR, value: '40.8 °C', limit: '40.0 °C' },
  { id: 'alm-4803', severity: 'medium', message: 'Bearing temperature signal lost', sensorTag: '40-TT-40015', assetId: '40-pa-4001', state: 'shelved', raisedAt: REFERENCE_NOW - 9 * HOUR, value: 'Bad quality', limit: '—' },
  { id: 'alm-4798', severity: 'low', message: 'Separator level deviation', sensorTag: '20-LT-10012', assetId: '20-va-1001', state: 'cleared', raisedAt: REFERENCE_NOW - 21 * HOUR, value: '71.2 %', limit: '70.0 %' },
  { id: 'alm-4790', severity: 'low', message: 'Export pump B standby test overdue', sensorTag: '27-PA-2001B', assetId: '27-pa-2001b', state: 'active', raisedAt: REFERENCE_NOW - 2 * DAY, value: '34 d', limit: '30 d' },
  { id: 'alm-4786', severity: 'medium', message: 'Motor current high', sensorTag: '27-IT-20013', assetId: '27-pa-2001a', state: 'cleared', raisedAt: REFERENCE_NOW - 3 * DAY, value: '96.4 A', limit: '95.0 A' },
];

export type Person = { id: string; name: string; initials: string; role: string };

export const PEOPLE: readonly Person[] = [
  { id: 'ih', name: 'Ingrid Haugen', initials: 'IH', role: 'Control room operator' },
  { id: 'ms', name: 'Magnus Solberg', initials: 'MS', role: 'Maintenance planner' },
  { id: 'ak', name: 'Aisha Khan', initials: 'AK', role: 'Rotating equipment engineer' },
  { id: 'tb', name: 'Tomás Barros', initials: 'TB', role: 'Mechanical technician' },
  { id: 'lw', name: 'Liv Wold', initials: 'LW', role: 'Shift supervisor' },
  { id: 'jn', name: 'Jonas Nyberg', initials: 'JN', role: 'Instrument technician' },
];

export type WorkOrder = {
  id: string;
  title: string;
  assetId: string;
  type: 'corrective' | 'preventive' | 'inspection' | 'modification';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'open' | 'planned' | 'in-progress' | 'waiting' | 'done';
  assigneeId: string | null;
  dueAt: number;
  estimatedHours: number;
  /** 0–100. */
  progress: number;
};

export const WORK_ORDERS: readonly WorkOrder[] = [
  { id: 'WO-104482', title: 'Inspect recompressor drive-end bearing', assetId: '23-ka-9103', type: 'corrective', priority: 'P1', status: 'in-progress', assigneeId: 'tb', dueAt: REFERENCE_NOW + 6 * HOUR, estimatedHours: 8, progress: 35 },
  { id: 'WO-104479', title: 'Replace bearing temperature transmitter', assetId: '40-pa-4001', type: 'corrective', priority: 'P2', status: 'planned', assigneeId: 'jn', dueAt: REFERENCE_NOW + 1 * DAY, estimatedHours: 3, progress: 0 },
  { id: 'WO-104471', title: 'Clean interstage cooler tube bundle', assetId: '23-ha-9114', type: 'preventive', priority: 'P2', status: 'waiting', assigneeId: 'ms', dueAt: REFERENCE_NOW + 4 * DAY, estimatedHours: 16, progress: 10 },
  { id: 'WO-104466', title: 'Vibration survey, 1st stage compressor', assetId: '23-ka-9101', type: 'inspection', priority: 'P2', status: 'open', assigneeId: null, dueAt: REFERENCE_NOW + 2 * DAY, estimatedHours: 4, progress: 0 },
  { id: 'WO-104458', title: 'Standby start test, export pump B', assetId: '27-pa-2001b', type: 'preventive', priority: 'P3', status: 'open', assigneeId: null, dueAt: REFERENCE_NOW - 4 * DAY, estimatedHours: 2, progress: 0 },
  { id: 'WO-104440', title: 'Calibrate separator level transmitter', assetId: '20-va-1001', type: 'preventive', priority: 'P3', status: 'done', assigneeId: 'jn', dueAt: REFERENCE_NOW - 1 * DAY, estimatedHours: 2, progress: 100 },
  { id: 'WO-104431', title: 'Partial stroke test, inlet shutdown valve', assetId: '20-xv-1105', type: 'inspection', priority: 'P2', status: 'done', assigneeId: 'tb', dueAt: REFERENCE_NOW - 2 * DAY, estimatedHours: 1, progress: 100 },
  { id: 'WO-104419', title: 'Upgrade turbine control firmware', assetId: '23-gt-9001', type: 'modification', priority: 'P4', status: 'planned', assigneeId: 'ak', dueAt: REFERENCE_NOW + 12 * DAY, estimatedHours: 24, progress: 0 },
];

/** Plant-level figures for KPI tiles and dashboards. */
export const PLANT_KPIS = {
  availability: { value: 96.4, target: 97.5, previous: 97.1, unit: '%' },
  oee: { value: 82.7, target: 85, previous: 81.9, unit: '%' },
  gasExport: { value: 4.38, target: 4.5, previous: 4.21, unit: 'MSm³/d' },
  energyIntensity: { value: 31.2, target: 30, previous: 32.6, unit: 'kWh/boe' },
  flaring: { value: 12.4, target: 15, previous: 18.9, unit: 'kSm³/d' },
  activeAlarms: { value: 4, target: 0, previous: 7, unit: '' },
  openWorkOrders: { value: 23, target: 20, previous: 27, unit: '' },
  mtbf: { value: 412, target: 450, previous: 396, unit: 'h' },
  daysSinceIncident: { value: 218, target: 365, previous: 217, unit: 'd' },
} as const;

export function findAsset(assetId: string): Asset | undefined {
  return ASSETS.find((asset) => asset.id === assetId);
}

export function findPerson(personId: string | null): Person | undefined {
  return PEOPLE.find((person) => person.id === personId);
}

export function childrenOf(assetId: string | null): Asset[] {
  return ASSETS.filter((asset) => asset.parentId === assetId);
}

export function sensorsOf(assetId: string): Sensor[] {
  return SENSORS.filter((sensor) => sensor.assetId === assetId);
}
