import type { PidAlarm, PidDocument, PidDrawing } from './pidModel';

/** A small drawing for tests and examples: a separator feeding a compressor through one valve. */
export const PID_FIXTURE: PidDrawing = {
  id: 'fixture',
  number: 'NK-23-PID-0001',
  title: 'Compression test loop',
  area: 'Gas compression',
  revision: 'B',
  status: 'Issued for operation',
  issuedOn: '2 Feb 2026',
  drawnBy: 'AK',
  checkedBy: 'LW',
  sheet: '1 of 1',
  width: 600,
  height: 320,
  equipment: [
    { id: 'va-1001', tag: '20-VA-1001', name: 'Inlet separator', kind: 'horizontal-separator', x: 120, y: 160, state: 'running' },
    { id: 'ka-9101', tag: '23-KA-9101', name: '1st stage compressor', kind: 'compressor', x: 440, y: 160, state: 'running' },
  ],
  valves: [{ id: 'hv-9105', tag: '23-HV-9105', name: 'Suction isolation valve', type: 'gate', x: 280, y: 160, position: 'open' }],
  instruments: [
    {
      id: 'pt-92530',
      tag: '23-PT-92530',
      name: 'Suction pressure',
      letters: 'PT',
      loop: '92530',
      x: 360,
      y: 90,
      tapTo: { x: 360, y: 160 },
      equipmentId: 'ka-9101',
      unit: 'barg',
      decimals: 1,
      limits: { low: 10, high: 15 },
      valueAt: 'above',
    },
    {
      id: 'tt-92532',
      tag: '23-TT-92532',
      name: 'Discharge temperature',
      letters: 'TT',
      loop: '92532',
      x: 520,
      y: 90,
      tapTo: { x: 520, y: 160 },
      equipmentId: 'ka-9101',
      unit: '°C',
      decimals: 1,
      limits: { low: 90, high: 145, highHigh: 155 },
      valueAt: 'above',
    },
  ],
  lines: [
    {
      id: 'l-1004',
      number: '8"-PG-23-1004',
      service: 'Process gas',
      points: [
        { x: 152, y: 160 },
        { x: 408, y: 160 },
      ],
      weight: 'heavy',
      flow: 'forward',
      label: { x: 220, y: 150 },
    },
    {
      id: 'l-1005',
      number: '6"-PG-23-1005',
      service: 'Process gas',
      points: [
        { x: 472, y: 160 },
        { x: 580, y: 160 },
      ],
      weight: 'heavy',
      flow: 'forward',
    },
  ],
  notes: [{ id: 'n-1', x: 40, y: 290, text: 'Note 1: all vents routed to flare header.' }],
  connectors: [{ id: 'c-1', x: 580, y: 160, label: 'To interstage cooler', drawing: 'NK-23-PID-0002', direction: 'out' }],
};

export const PID_FIXTURE_READINGS: Record<string, number | null> = { 'pt-92530': 12.4, 'tt-92532': 146.3 };

export const PID_FIXTURE_ALARMS: readonly PidAlarm[] = [
  { id: 'alm-1', tagId: 'tt-92532', severity: 'high', message: 'Discharge temperature high', detail: 'Active, 38 min ago' },
  { id: 'alm-2', tagId: 'ka-9101', severity: 'critical', message: 'Compressor vibration trip', detail: 'Active, 2 min ago' },
  { id: 'alm-3', tagId: 'ka-9101', severity: 'low', message: 'Lube oil filter differential', detail: 'Acknowledged, 3 h ago' },
];

export const PID_FIXTURE_DOCUMENTS: readonly PidDocument[] = [
  { id: 'doc-1', title: 'Compressor datasheet', kind: 'Datasheet', revision: 'C', tagIds: ['ka-9101'] },
  { id: 'doc-2', title: 'Loop diagram 92532', kind: 'Loop diagram', revision: 'A', tagIds: ['tt-92532', 'ka-9101'] },
];
