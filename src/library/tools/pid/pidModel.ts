import type { PlanRect } from '../../experiences/drilldown/planLayout';
import { estimateTextWidth } from '../../industrial/diagrams/diagramGeometry';
import type { Point } from '../../industrial/diagrams/diagramGeometry';
import type { PipeWeight } from '../../industrial/diagrams/PipeLine';
import type { SymbolKind } from '../../industrial/diagrams/symbolPaths';
import type { ValvePosition } from '../../industrial/diagrams/symbolState';
import type { ValveType } from '../../industrial/diagrams/ValveSymbol';
import { toneFromLimits } from '../../industrial/status';
import type { Limits, RunState, Severity, Tone } from '../../industrial/status';

/**
 * The data a P&ID viewer draws, and the pure questions asked of it: which tags exist, where they
 * sit, what a search matches and what lies under a point. A drawing is plain data in world units
 * (one unit is one pixel at 100 %), so it can come from a file, an API or a fixture.
 */

export type PidLayer = 'lines' | 'instruments' | 'values' | 'alarms' | 'annotations';

export const PID_LAYERS: readonly { id: PidLayer; label: string }[] = [
  { id: 'lines', label: 'Process lines' },
  { id: 'instruments', label: 'Instruments' },
  { id: 'values', label: 'Live values' },
  { id: 'alarms', label: 'Alarms' },
  { id: 'annotations', label: 'Annotations' },
];

export type PidLayers = Record<PidLayer, boolean>;

export const ALL_LAYERS_ON: PidLayers = { lines: true, instruments: true, values: true, alarms: true, annotations: true };

export type PidEquipment = {
  id: string;
  tag: string;
  name: string;
  kind: SymbolKind;
  /** Centre of the symbol. */
  x: number;
  y: number;
  size?: number;
  state: RunState;
};

export type PidValve = {
  id: string;
  tag: string;
  name: string;
  type: ValveType;
  /** Where the valve sits on its line: the point the line passes through. */
  x: number;
  y: number;
  size?: number;
  position: ValvePosition;
};

export type PidInstrument = {
  id: string;
  tag: string;
  name: string;
  /** ISA function letters and loop number, as printed in the bubble. */
  letters: string;
  loop: string;
  /** Centre of the bubble. */
  x: number;
  y: number;
  mounting?: 'field' | 'panel';
  /** Where the measurement is taken; a thin tap line is drawn to it. */
  tapTo?: Point;
  /** The equipment the measurement belongs to. */
  equipmentId?: string;
  unit: string;
  decimals: number;
  limits: Limits;
  /** Side of the bubble the live value sits on. */
  valueAt?: 'above' | 'below';
};

export type PidLine = {
  id: string;
  /** Line number, such as 8"-PG-23-1004. */
  number: string;
  /** What flows in it, in words. */
  service: string;
  points: readonly Point[];
  weight?: PipeWeight;
  dashed?: boolean;
  flow?: 'forward' | 'reverse';
  arrows?: number;
  /** Where the line number is printed. Left out, the number is not drawn. */
  label?: { x: number; y: number; anchor?: 'start' | 'middle' | 'end' };
};

export type PidNote = { id: string; x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' };

/** An off-page connector: where a line continues on another drawing. */
export type PidConnector = { id: string; x: number; y: number; label: string; drawing: string; direction: 'in' | 'out' };

export type PidDrawing = {
  id: string;
  /** Drawing number as it appears in the document register. */
  number: string;
  title: string;
  area: string;
  revision: string;
  /** Issue status in words: "Issued for operation". */
  status: string;
  issuedOn: string;
  drawnBy: string;
  checkedBy: string;
  sheet: string;
  width: number;
  height: number;
  equipment: readonly PidEquipment[];
  valves: readonly PidValve[];
  instruments: readonly PidInstrument[];
  lines: readonly PidLine[];
  notes: readonly PidNote[];
  connectors: readonly PidConnector[];
};

export type PidTagKind = 'equipment' | 'valve' | 'instrument';

export type PidTagRef = {
  id: string;
  tag: string;
  name: string;
  kind: PidTagKind;
  /** Clickable area: the symbol and its labels. */
  bounds: PlanRect;
  centre: Point;
};

export type PidAlarm = {
  id: string;
  /** Id of the drawing element the alarm belongs to. */
  tagId: string;
  severity: Severity;
  message: string;
  /** Alarm state and age in words: "Active, 14 min ago". */
  detail: string;
};

export type PidDocument = { id: string; title: string; kind: string; revision: string; tagIds: readonly string[] };

export type PidPin = { id: string; x: number; y: number; note: string };

export const EQUIPMENT_SIZE = 64;
export const VALVE_SIZE = 36;
export const INSTRUMENT_SIZE = 40;
const LABEL_SIZE = 10;

/** A valve symbol's ports sit below its middle, so its centre is lifted off the line. */
export const valveCentreY = (valve: Pick<PidValve, 'y' | 'size'>): number => valve.y - (valve.size ?? VALVE_SIZE) / 8;

export function equipmentBounds(equipment: PidEquipment): PlanRect {
  const size = equipment.size ?? EQUIPMENT_SIZE;
  const width = Math.max(size, estimateTextWidth(equipment.tag, LABEL_SIZE, true), estimateTextWidth(equipment.name, LABEL_SIZE)) + 12;
  return { x: equipment.x - width / 2, y: equipment.y - size / 2 - 6, width, height: size + 40 };
}

export function valveBounds(valve: PidValve): PlanRect {
  const size = valve.size ?? VALVE_SIZE;
  const width = Math.max(size, estimateTextWidth(valve.tag, LABEL_SIZE, true)) + 10;
  const top = valveCentreY(valve) - size / 2 - 4;
  return { x: valve.x - width / 2, y: top, width, height: valve.y + size / 2 + 12 - top };
}

export function instrumentBounds(instrument: PidInstrument): PlanRect {
  const half = INSTRUMENT_SIZE / 2 + 4;
  return { x: instrument.x - half, y: instrument.y - half, width: half * 2, height: half * 2 };
}

const centreOf = (rect: PlanRect): Point => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });

/** Every selectable tag of a drawing in reading order: left to right, then top to bottom. */
export function tagRefs(drawing: PidDrawing): PidTagRef[] {
  const refs: PidTagRef[] = [
    ...drawing.equipment.map((item) => ({ id: item.id, tag: item.tag, name: item.name, kind: 'equipment' as const, bounds: equipmentBounds(item) })),
    ...drawing.valves.map((item) => ({ id: item.id, tag: item.tag, name: item.name, kind: 'valve' as const, bounds: valveBounds(item) })),
    ...drawing.instruments.map((item) => ({ id: item.id, tag: item.tag, name: item.name, kind: 'instrument' as const, bounds: instrumentBounds(item) })),
  ].map((ref) => ({ ...ref, centre: centreOf(ref.bounds) }));
  return refs.sort((a, b) => a.centre.x - b.centre.x || a.centre.y - b.centre.y);
}

export function findTag(drawing: PidDrawing, id: string): PidTagRef | undefined {
  return tagRefs(drawing).find((ref) => ref.id === id);
}

const normalise = (text: string): string => text.toLowerCase().replace(/[\s\-_.]/g, '');

/**
 * Tags matching a query, best first: a tag that starts with it, then a tag that contains it, then
 * a name that contains it. Hyphens, spaces and case are ignored, so "pt92531" finds 23-PT-92531.
 */
export function searchTags(drawing: PidDrawing, query: string, limit = 8): PidTagRef[] {
  const needle = normalise(query);
  if (needle === '') return [];
  const ranked: { ref: PidTagRef; rank: number }[] = [];
  for (const ref of tagRefs(drawing)) {
    const tag = normalise(ref.tag);
    const rank = tag.startsWith(needle) ? 0 : tag.includes(needle) ? 1 : normalise(ref.name).includes(needle) ? 2 : -1;
    if (rank >= 0) ranked.push({ ref, rank });
  }
  return ranked
    .sort((a, b) => a.rank - b.rank || a.ref.tag.localeCompare(b.ref.tag))
    .slice(0, limit)
    .map((entry) => entry.ref);
}

const contains = (rect: PlanRect, point: Point): boolean =>
  point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;

/** The tag under a world point. Where areas overlap the smallest wins, so a bubble beats a vessel. */
export function tagAt(drawing: PidDrawing, point: Point): PidTagRef | undefined {
  return tagRefs(drawing)
    .filter((ref) => contains(ref.bounds, point))
    .sort((a, b) => a.bounds.width * a.bounds.height - b.bounds.width * b.bounds.height)[0];
}

/** Shortest distance from a point to a segment. */
export function distanceToSegment(point: Point, from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - from.x, point.y - from.y);
  const t = Math.min(1, Math.max(0, ((point.x - from.x) * dx + (point.y - from.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (from.x + dx * t), point.y - (from.y + dy * t));
}

/** Shortest distance from a point to a route. Infinity for a route with fewer than two points. */
export function distanceToRoute(point: Point, route: readonly Point[]): number {
  let nearest = Infinity;
  for (let index = 1; index < route.length; index += 1) {
    nearest = Math.min(nearest, distanceToSegment(point, route[index - 1], route[index]));
  }
  return nearest;
}

/** The line nearest a world point, when one runs within `tolerance` units of it. */
export function lineAt(drawing: PidDrawing, point: Point, tolerance = 6): PidLine | undefined {
  let best: PidLine | undefined;
  let bestDistance = tolerance;
  for (const line of drawing.lines) {
    const distance = distanceToRoute(point, line.points);
    if (distance <= bestDistance) {
      best = line;
      bestDistance = distance;
    }
  }
  return best;
}

/** Bounding box of a route, for flying to a line. */
export function routeBounds(route: readonly Point[]): PlanRect {
  const xs = route.map((point) => point.x);
  const ys = route.map((point) => point.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** A rectangle grown by `by` units on every side. */
export function padRect(rect: PlanRect, by: number): PlanRect {
  return { x: rect.x - by, y: rect.y - by, width: rect.width + by * 2, height: rect.height + by * 2 };
}

export type ReadingState = { tone: Tone; flag?: 'LL' | 'L' | 'H' | 'HH'; label: string };

/** A reading against its limits: the tone and the letter flag printed beside the value. */
export function readingState(value: number | null | undefined, limits: Limits): ReadingState {
  if (value === null || value === undefined || !Number.isFinite(value)) return { tone: 'neutral', label: 'No data' };
  const tone = toneFromLimits(value, limits);
  if (tone === 'critical') {
    const high = limits.highHigh !== undefined && value >= limits.highHigh;
    return { tone, flag: high ? 'HH' : 'LL', label: high ? 'High-high' : 'Low-low' };
  }
  if (tone === 'warning') {
    const high = limits.high !== undefined && value > limits.high;
    return { tone, flag: high ? 'H' : 'L', label: high ? 'High' : 'Low' };
  }
  return { tone, label: 'Within limits' };
}

/** Alarms raised on a tag, most severe first. */
export function alarmsFor(alarms: readonly PidAlarm[], tagId: string): PidAlarm[] {
  const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return alarms.filter((alarm) => alarm.tagId === tagId).sort((a, b) => order[a.severity] - order[b.severity]);
}

/** The most severe alarm per tag: what the overlay draws. */
export function worstAlarmByTag(alarms: readonly PidAlarm[]): Map<string, PidAlarm> {
  const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const worst = new Map<string, PidAlarm>();
  for (const alarm of alarms) {
    const current = worst.get(alarm.tagId);
    if (!current || order[alarm.severity] < order[current.severity]) worst.set(alarm.tagId, alarm);
  }
  return worst;
}

/** Documents linked to a tag. */
export function documentsFor(documents: readonly PidDocument[], tagId: string): PidDocument[] {
  return documents.filter((document) => document.tagIds.includes(tagId));
}

/** The tag after (or before) the current one in reading order, wrapping at the ends. */
export function nextTag(refs: readonly PidTagRef[], currentId: string | null, step: 1 | -1 = 1): PidTagRef | undefined {
  if (refs.length === 0) return undefined;
  const index = refs.findIndex((ref) => ref.id === currentId);
  if (index === -1) return step === 1 ? refs[0] : refs[refs.length - 1];
  return refs[(index + step + refs.length) % refs.length];
}
