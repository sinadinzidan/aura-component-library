import type { SymbolKind } from '../../industrial/diagrams/symbolPaths';
import type { ValvePosition } from '../../industrial/diagrams/symbolState';
import type { RunState } from '../../industrial/status';
import type { Vec3 } from '../cameraTargets';
import type { PlantEquipment } from '../plantLayout';

import type { TagLink } from './tagMapping';

/** A symbol on the P&ID, positioned in diagram units. */
export type DrawingItem = {
  /** Id of the symbol in the drawing file. */
  id: string;
  tag: string;
  symbol: SymbolKind;
  /** Centre of the symbol. For valves this is where the line meets it, not the symbol's own centre. */
  cx: number;
  /** Height of the line the symbol sits on. */
  cy: number;
  size: number;
  valveType?: 'shutdown' | 'control' | 'gate';
};

/**
 * The one table that ties the drawing to the 3D model. The functional location tag is the key;
 * the drawing and the model each have their own ids for the same thing. A tag may exist on one
 * side only: that is what the model check reports.
 */
export const COMPRESSION_LINKS: readonly TagLink[] = [
  { tag: '23-XV-9111', drawingId: 'S-101', sceneId: 'N-4101' },
  { tag: '23-VA-9120', drawingId: 'S-102', sceneId: 'N-4102' },
  { tag: '23-KA-9101', drawingId: 'S-103', sceneId: 'N-4103' },
  { tag: '23-HA-9114', drawingId: 'S-104', sceneId: 'N-4104' },
  { tag: '23-KA-9102', drawingId: 'S-105', sceneId: 'N-4105' },
  { tag: '23-HV-9162', drawingId: 'S-106', sceneId: null },
  { tag: '23-XV-9171', drawingId: null, sceneId: 'N-4106' },
  { tag: '23-GT-9001', drawingId: null, sceneId: 'N-4107' },
];

export const COMPRESSION_DRAWING_SIZE = { width: 640, height: 340 } as const;
export const COMPRESSION_LINE_Y = 170;
export const COMPRESSION_RECYCLE_Y = 70;

/** Symbols on the drawing, left to right along the process line. */
export const COMPRESSION_DRAWING: readonly DrawingItem[] = [
  { id: 'S-101', tag: '23-XV-9111', symbol: 'shutdown-valve', cx: 100, cy: COMPRESSION_LINE_Y, size: 40, valveType: 'shutdown' },
  { id: 'S-102', tag: '23-VA-9120', symbol: 'vertical-vessel', cx: 196, cy: COMPRESSION_LINE_Y, size: 72 },
  { id: 'S-103', tag: '23-KA-9101', symbol: 'compressor', cx: 296, cy: COMPRESSION_LINE_Y, size: 60 },
  { id: 'S-104', tag: '23-HA-9114', symbol: 'heat-exchanger', cx: 396, cy: COMPRESSION_LINE_Y, size: 60 },
  { id: 'S-105', tag: '23-KA-9102', symbol: 'compressor', cx: 496, cy: COMPRESSION_LINE_Y, size: 60 },
  { id: 'S-106', tag: '23-HV-9162', symbol: 'control-valve', cx: 346, cy: COMPRESSION_RECYCLE_Y, size: 40, valveType: 'control' },
];

/** Objects in the 3D model, with their own scene ids. `id` is the scene id, `tag` the common key. */
export const COMPRESSION_SCENE: readonly PlantEquipment[] = [
  { id: 'N-4101', kind: 'valve', tag: '23-XV-9111', position: [-22, 0, -10] },
  { id: 'N-4102', kind: 'vertical-vessel', tag: '23-VA-9120', position: [-12, 0, -10] },
  { id: 'N-4103', kind: 'compressor', tag: '23-KA-9101', position: [3, 0, -10] },
  { id: 'N-4104', kind: 'heat-exchanger', tag: '23-HA-9114', position: [19, 0, -10] },
  { id: 'N-4105', kind: 'compressor', tag: '23-KA-9102', position: [4, 0, 8] },
  { id: 'N-4106', kind: 'valve', tag: '23-XV-9171', position: [19, 0, 8] },
  { id: 'N-4107', kind: 'turbine', tag: '23-GT-9001', position: [-14, 0, 8] },
];

/** Connecting pipework in the 3D model, in scene coordinates. */
export const COMPRESSION_PIPES: readonly (readonly Vec3[])[] = [
  [[-19.2, 1.4, -10], [-14.4, 1.4, -10]],
  [[-9.6, 1.4, -10], [-2, 1.4, -10], [-2, 4.2, -10]],
  [[8, 1.4, -10], [14.6, 1.4, -10]],
  [[23.4, 1.4, -10], [26, 1.4, -10], [26, 1.4, 8], [22, 1.4, 8]],
];

export type ItemReading = { label: string; value: number; unit: string; decimals?: number };

export type ItemInfo = {
  name: string;
  kind: 'equipment' | 'valve';
  /** Run state of a machine. */
  run?: RunState;
  /** Position of a valve. */
  valve?: ValvePosition;
  /** The three figures that matter for this item. */
  readings: readonly [ItemReading, ItemReading, ItemReading];
};

/** What the selection bar shows for each tag. Machines follow the plant data; valves are specific to this area. */
export const COMPRESSION_INFO: Readonly<Record<string, ItemInfo>> = {
  '23-XV-9111': { name: 'Inlet shutdown valve', kind: 'valve', valve: 'open', readings: [{ label: 'Upstream pressure', value: 12.6, unit: 'barg', decimals: 1 }, { label: 'Differential', value: 0.2, unit: 'bar', decimals: 1 }, { label: 'Stroke time', value: 8.4, unit: 's', decimals: 1 }] },
  '23-VA-9120': { name: 'Suction scrubber', kind: 'equipment', run: 'running', readings: [{ label: 'Level', value: 41, unit: '%' }, { label: 'Pressure', value: 12.4, unit: 'barg', decimals: 1 }, { label: 'Temperature', value: 28, unit: '°C' }] },
  '23-KA-9101': { name: '1st stage compressor', kind: 'equipment', run: 'running', readings: [{ label: 'Discharge pressure', value: 48.6, unit: 'barg', decimals: 1 }, { label: 'Discharge temperature', value: 141.2, unit: '°C', decimals: 1 }, { label: 'Shaft speed', value: 9840, unit: 'rpm' }] },
  '23-HA-9114': { name: 'Interstage cooler', kind: 'equipment', run: 'running', readings: [{ label: 'Outlet temperature', value: 38.9, unit: '°C', decimals: 1 }, { label: 'Duty', value: 3.2, unit: 'MW', decimals: 1 }, { label: 'Pressure drop', value: 0.6, unit: 'bar', decimals: 1 }] },
  '23-KA-9102': { name: '2nd stage compressor', kind: 'equipment', run: 'running', readings: [{ label: 'Discharge pressure', value: 96.2, unit: 'barg', decimals: 1 }, { label: 'Discharge temperature', value: 128.4, unit: '°C', decimals: 1 }, { label: 'Vibration', value: 4.1, unit: 'mm/s', decimals: 1 }] },
  '23-HV-9162': { name: 'Recycle control valve', kind: 'valve', valve: 'open', readings: [{ label: 'Opening', value: 62, unit: '%' }, { label: 'Recycle flow', value: 18400, unit: 'Sm³/h' }, { label: 'Differential', value: 1.4, unit: 'bar', decimals: 1 }] },
  '23-XV-9171': { name: 'Export shutdown valve', kind: 'valve', valve: 'closed', readings: [{ label: 'Upstream pressure', value: 96, unit: 'barg' }, { label: 'Differential', value: 0.1, unit: 'bar', decimals: 1 }, { label: 'Stroke time', value: 11.2, unit: 's', decimals: 1 }] },
  '23-GT-9001': { name: 'Compressor gas turbine', kind: 'equipment', run: 'running', readings: [{ label: 'Power turbine speed', value: 9840, unit: 'rpm' }, { label: 'Exhaust temperature', value: 486, unit: '°C' }, { label: 'Load', value: 71, unit: '%' }] },
};

/** Tags of everything on the drawing. */
export const drawingTags = (): string[] => COMPRESSION_DRAWING.map((item) => item.tag);

/** Tags of everything in the 3D model. */
export const sceneTags = (): string[] => COMPRESSION_SCENE.map((item) => item.tag);

/** The item for a tag on the drawing; `null` when the drawing does not show it. */
export function drawingItemFor(tag: string | null): DrawingItem | null {
  return COMPRESSION_DRAWING.find((item) => item.tag === tag) ?? null;
}

/** The object for a tag in the 3D model; `null` when the model does not have it. */
export function sceneItemFor(tag: string | null): PlantEquipment | null {
  return COMPRESSION_SCENE.find((item) => item.tag === tag) ?? null;
}
