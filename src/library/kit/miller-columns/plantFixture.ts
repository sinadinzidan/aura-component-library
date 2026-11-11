import type { TreeSensor } from './assetTree';

/**
 * Measurement points on the machines the shared Nordkapp plant leaves bare, in the same tag style,
 * so every unit in a structure explorer has at least one tag to drill into.
 */
export const EXTRA_SENSORS: readonly TreeSensor[] = [
  { id: 'lt-10022', tag: '20-LT-10022', name: 'Separator level', assetId: '20-va-1002', unit: '%', value: 12.5, lowLimit: 0, highLimit: 70, highHighLimit: 85, rangeMin: 0, rangeMax: 100, decimals: 1, quality: 'good', seed: 51 },
  { id: 'zt-11051', tag: '20-ZT-11051', name: 'Valve position', assetId: '20-xv-1105', unit: '%', value: 100, lowLimit: 95, highLimit: 100, rangeMin: 0, rangeMax: 100, decimals: 0, quality: 'good', seed: 52 },
  { id: 'pt-92631', tag: '23-PT-92631', name: 'Discharge pressure', assetId: '23-ka-9102', unit: 'barg', value: 96.4, lowLimit: 85, highLimit: 102, highHighLimit: 108, rangeMin: 0, rangeMax: 120, decimals: 1, quality: 'good', seed: 53 },
  { id: 'tt-92632', tag: '23-TT-92632', name: 'Discharge temperature', assetId: '23-ka-9102', unit: '°C', value: 128.5, lowLimit: 90, highLimit: 145, highHighLimit: 155, rangeMin: 0, rangeMax: 180, decimals: 1, quality: 'good', seed: 54 },
  { id: 'vt-92640', tag: '23-VT-92640', name: 'Drive-end vibration', assetId: '23-ka-9102', unit: 'mm/s', value: 3.2, lowLimit: 0, highLimit: 7.1, highHighLimit: 11, rangeMin: 0, rangeMax: 15, decimals: 1, quality: 'good', seed: 55 },
  { id: 'vt-92740', tag: '23-VT-92740', name: 'Drive-end vibration', assetId: '23-ka-9103', unit: 'mm/s', value: 11.6, lowLimit: 0, highLimit: 7.1, highHighLimit: 11, rangeMin: 0, rangeMax: 15, decimals: 1, quality: 'good', seed: 56 },
  { id: 'st-92701', tag: '23-ST-92701', name: 'Shaft speed', assetId: '23-ka-9103', unit: 'rpm', value: 0, lowLimit: 0, highLimit: 10500, rangeMin: 0, rangeMax: 12000, decimals: 0, quality: 'good', seed: 57 },
  { id: 'tt-90011', tag: '23-TT-90011', name: 'Exhaust temperature', assetId: '23-gt-9001', unit: '°C', value: 512, lowLimit: 400, highLimit: 540, highHighLimit: 560, rangeMin: 0, rangeMax: 650, decimals: 0, quality: 'good', seed: 58 },
  { id: 'st-90001', tag: '23-ST-90001', name: 'Turbine speed', assetId: '23-gt-9001', unit: 'rpm', value: 9840, lowLimit: 7000, highLimit: 10500, rangeMin: 0, rangeMax: 12000, decimals: 0, quality: 'good', seed: 59 },
  { id: 'it-20023', tag: '27-IT-20023', name: 'Motor current', assetId: '27-pa-2001b', unit: 'A', value: 0, lowLimit: 0, highLimit: 95, highHighLimit: 105, rangeMin: 0, rangeMax: 120, decimals: 1, quality: 'good', seed: 60 },
];
