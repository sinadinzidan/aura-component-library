import type { PidAlarm, PidDrawing, PidPin } from '../../tools/pid/pidModel';

/**
 * The gas compression P&ID as data for the P&ID tool, drawn compactly in two rows so it stays
 * readable in half a screen. Equipment and valve ids are the drawing ids of the tag-link table,
 * which is what lets a selection here find its counterpart in the 3D model.
 */
export const COMPRESSION_SHEET: PidDrawing = {
  id: 'nk-23-pid-1004',
  number: 'NK-23-PID-1004',
  title: 'Gas compression, stages 1 and 2',
  area: 'Gas compression',
  revision: 'C',
  status: 'Issued for operation',
  issuedOn: '14 Jan 2026',
  drawnBy: 'AK',
  checkedBy: 'LW',
  sheet: '1 of 1',
  width: 480,
  height: 430,
  equipment: [
    { id: 'S-102', tag: '23-VA-9120', name: 'Suction scrubber', kind: 'vertical-vessel', x: 180, y: 120, state: 'running' },
    { id: 'S-103', tag: '23-KA-9101', name: '1st stage compressor', kind: 'compressor', x: 315, y: 120, size: 60, state: 'running' },
    { id: 'S-104', tag: '23-HA-9114', name: 'Interstage cooler', kind: 'heat-exchanger', x: 130, y: 322, size: 60, state: 'running' },
    { id: 'S-105', tag: '23-KA-9102', name: '2nd stage compressor', kind: 'compressor', x: 325, y: 322, size: 60, state: 'running' },
  ],
  valves: [
    { id: 'S-101', tag: '23-XV-9111', name: 'Inlet shutdown valve', type: 'shutdown', x: 70, y: 120, position: 'open' },
    { id: 'S-106', tag: '23-HV-9162', name: 'Recycle control valve', type: 'control', x: 250, y: 40, position: 'closed' },
  ],
  instruments: [
    {
      id: 'pt-92531',
      tag: '23-PT-92531',
      name: 'Discharge pressure',
      letters: 'PT',
      loop: '92531',
      x: 415,
      y: 62,
      tapTo: { x: 415, y: 120 },
      equipmentId: 'S-103',
      unit: 'barg',
      decimals: 1,
      limits: { low: 40, high: 52, highHigh: 55 },
      valueAt: 'above',
    },
    {
      id: 'tt-91141',
      tag: '23-TT-91141',
      name: 'Cooler outlet temperature',
      letters: 'TT',
      loop: '91141',
      x: 228,
      y: 270,
      tapTo: { x: 228, y: 322 },
      equipmentId: 'S-104',
      unit: '°C',
      decimals: 1,
      limits: { low: 20, high: 40, highHigh: 45 },
      valueAt: 'above',
    },
  ],
  lines: [
    {
      id: 'l-1001',
      number: '12"-PG-23-1001',
      service: 'Process gas from inlet separation',
      points: [
        { x: 14, y: 120 },
        { x: 52, y: 120 },
      ],
      weight: 'heavy',
      flow: 'forward',
    },
    {
      id: 'l-1002',
      number: '12"-PG-23-1002',
      service: 'Process gas to the suction scrubber',
      points: [
        { x: 88, y: 120 },
        { x: 160, y: 120 },
      ],
      weight: 'heavy',
      flow: 'forward',
    },
    {
      id: 'l-1003',
      number: '10"-PG-23-1003',
      service: 'Scrubbed gas to the 1st stage',
      points: [
        { x: 200, y: 120 },
        { x: 285, y: 120 },
      ],
      weight: 'heavy',
      flow: 'forward',
    },
    {
      id: 'l-1004',
      number: '8"-PG-23-1004',
      service: '1st stage discharge to the interstage cooler',
      points: [
        { x: 345, y: 120 },
        { x: 462, y: 120 },
        { x: 462, y: 200 },
        { x: 30, y: 200 },
        { x: 30, y: 322 },
        { x: 100, y: 322 },
      ],
      weight: 'heavy',
      flow: 'forward',
      arrows: 2,
      label: { x: 110, y: 216 },
    },
    {
      id: 'l-1005',
      number: '8"-PG-23-1005',
      service: 'Cooled gas to the 2nd stage',
      points: [
        { x: 160, y: 322 },
        { x: 295, y: 322 },
      ],
      weight: 'heavy',
      flow: 'forward',
    },
    {
      id: 'l-1006',
      number: '6"-PG-23-1006',
      service: '2nd stage discharge to gas export',
      points: [
        { x: 355, y: 322 },
        { x: 408, y: 322 },
      ],
      weight: 'heavy',
      flow: 'forward',
    },
    {
      id: 'l-1062',
      number: '4"-PG-23-1062',
      service: 'Anti-surge recycle to the scrubber inlet',
      points: [
        { x: 370, y: 120 },
        { x: 370, y: 40 },
        { x: 125, y: 40 },
        { x: 125, y: 120 },
      ],
      weight: 'light',
      flow: 'forward',
      label: { x: 178, y: 33, anchor: 'middle' },
    },
  ],
  notes: [
    { id: 'n-1', x: 14, y: 84, text: 'From 20-VA-1001' },
    { id: 'n-2', x: 14, y: 418, text: 'Note 1: recycle valve fails open on loss of signal.' },
  ],
  connectors: [{ id: 'c-1', x: 408, y: 322, label: 'Export', drawing: 'PID-2701', direction: 'out' }],
};

/** Live values per instrument id for the sheet. */
export const COMPRESSION_SHEET_READINGS: Readonly<Record<string, number | null>> = { 'pt-92531': 48.6, 'tt-91141': 40.8 };

export const COMPRESSION_SHEET_ALARMS: readonly PidAlarm[] = [{ id: 'alm-91141', tagId: 'tt-91141', severity: 'medium', message: 'Cooler outlet temperature high', detail: 'Acknowledged, 5 h ago' }];

/**
 * The functional location tag a drawing element stands for. Equipment and valves are their own
 * tag; an instrument answers with the equipment it measures, so clicking a bubble selects the
 * machine in the 3D model. `null` for ids the drawing does not have.
 */
export function tagOfSheetElement(drawing: PidDrawing, id: string): string | null {
  const direct = [...drawing.equipment, ...drawing.valves].find((item) => item.id === id);
  if (direct) return direct.tag;
  const instrument = drawing.instruments.find((item) => item.id === id);
  if (!instrument) return null;
  return drawing.equipment.find((item) => item.id === instrument.equipmentId)?.tag ?? null;
}

/** The id of the drawing element that carries a tag; `null` when the sheet does not show it. */
export function sheetElementOfTag(drawing: PidDrawing, tag: string | null): string | null {
  if (tag === null) return null;
  return [...drawing.equipment, ...drawing.valves].find((item) => item.tag === tag)?.id ?? null;
}

/** Every equipment and valve tag on the sheet, in drawing order. */
export function sheetTags(drawing: PidDrawing): string[] {
  return [...drawing.valves, ...drawing.equipment].sort((a, b) => a.id.localeCompare(b.id)).map((item) => item.tag);
}

/** A numbered pin over each tag given, to flag elements on the drawing: `pin-1`, `pin-2`, … in the order given. */
export function pinsForTags(drawing: PidDrawing, tags: readonly string[], note: string): PidPin[] {
  return tags.flatMap((tag, index) => {
    const valve = drawing.valves.find((item) => item.tag === tag);
    const equipment = drawing.equipment.find((item) => item.tag === tag);
    const at = valve ? { x: valve.x + 26, y: valve.y - 6 } : equipment ? { x: equipment.x + 30, y: equipment.y - 26 } : null;
    return at ? [{ id: `pin-${index + 1}`, x: at.x, y: at.y, note }] : [];
  });
}
