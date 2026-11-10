import { circlePath, placePoint } from './diagramGeometry';
import type { Point } from './diagramGeometry';

/**
 * The equipment symbol set as pure data. Every symbol is drawn on the same 24 × 24 grid with a
 * 2-unit margin, so glyphs line up in a legend and scale together in a diagram. Process symbols
 * read left to right and connect on their `in` / `out` ports; electrical symbols read top to
 * bottom and connect on `top` / `bottom`.
 */

export const SYMBOL_GRID = 24;

export type SymbolCategory = 'rotating' | 'static' | 'valve' | 'instrument' | 'piping' | 'electrical';

/**
 * How a path is painted. `line` is stroke only; `body` is the closed outline that a run state may
 * fill; `solid` is always filled (arrowheads, hubs).
 */
export type SymbolShapeRole = 'line' | 'body' | 'solid';

export type SymbolShape = { d: string; role: SymbolShapeRole; dashed?: boolean };

/** A letter inside a symbol, such as the M of a motor. */
export type SymbolText = { value: string; x: number; y: number; size: number };

export type SymbolPort = 'in' | 'out' | 'top' | 'bottom';

export type SymbolDefinition = {
  /** Name used in legends and as the default accessible name. */
  label: string;
  category: SymbolCategory;
  shapes: readonly SymbolShape[];
  texts?: readonly SymbolText[];
  /** Where pipes and conductors attach, in grid units. */
  ports: Partial<Record<SymbolPort, Point>>;
};

export const SYMBOL_KINDS = [
  'centrifugal-pump',
  'pd-pump',
  'compressor',
  'gas-turbine',
  'motor',
  'generator',
  'fan',
  'heat-exchanger',
  'air-cooler',
  'vertical-vessel',
  'horizontal-separator',
  'storage-tank',
  'column',
  'filter',
  'flare',
  'gate-valve',
  'control-valve',
  'check-valve',
  'shutdown-valve',
  'relief-valve',
  'instrument',
  'pipe',
  'transformer',
  'disconnector',
  'earth',
  'inverter',
  'battery',
  'wind-turbine',
  'solar-panel',
  'load',
] as const;

export type SymbolKind = (typeof SYMBOL_KINDS)[number];

const line = (d: string): SymbolShape => ({ d, role: 'line' });
const body = (d: string): SymbolShape => ({ d, role: 'body' });
const solid = (d: string): SymbolShape => ({ d, role: 'solid' });
const dashed = (d: string): SymbolShape => ({ d, role: 'line', dashed: true });

const ROUND_PORTS = { in: { x: 4, y: 12 }, out: { x: 20, y: 12 }, top: { x: 12, y: 4 }, bottom: { x: 12, y: 20 } };
const VALVE_PORTS = { in: { x: 4, y: 15 }, out: { x: 20, y: 15 } };
const VERTICAL_PORTS = { top: { x: 12, y: 2 }, bottom: { x: 12, y: 22 } };

/** The two triangles of an in-line valve, shared by every actuated valve. */
export const VALVE_BODY = 'M 4 10 L 20 20 V 10 L 4 20 Z';
/** The upstream triangle alone, filled to show a valve in travel. */
export const VALVE_BODY_UPSTREAM = 'M 4 10 L 12 15 L 4 20 Z';
/** A small cross beside the actuator, drawn when a valve has failed to reach position. */
export const VALVE_FAULT_MARK = 'M 17.5 2.5 L 21.5 6.5 M 21.5 2.5 L 17.5 6.5';

const PROPELLER = (cy: number): string =>
  `M 6 ${cy} Q 9 ${cy - 3.5} 12 ${cy} Q 15 ${cy + 3.5} 18 ${cy} Q 15 ${cy - 3.5} 12 ${cy} Q 9 ${cy + 3.5} 6 ${cy} Z`;

export const SYMBOLS: Record<SymbolKind, SymbolDefinition> = {
  'centrifugal-pump': {
    label: 'Centrifugal pump',
    category: 'rotating',
    shapes: [body(circlePath(12, 12, 8)), line('M 12 4 L 20 12 L 12 20')],
    ports: ROUND_PORTS,
  },
  'pd-pump': {
    label: 'Positive displacement pump',
    category: 'rotating',
    shapes: [body(circlePath(12, 12, 8)), line(circlePath(12, 8.5, 2.5)), line(circlePath(12, 15.5, 2.5))],
    ports: ROUND_PORTS,
  },
  compressor: {
    label: 'Compressor',
    category: 'rotating',
    shapes: [body('M 4 4 L 20 8.5 V 15.5 L 4 20 Z')],
    ports: { in: { x: 4, y: 12 }, out: { x: 20, y: 12 }, top: { x: 12, y: 6.25 }, bottom: { x: 12, y: 17.75 } },
  },
  'gas-turbine': {
    label: 'Gas turbine',
    category: 'rotating',
    shapes: [body('M 4 9 L 20 5 V 19 L 4 15 Z'), line('M 8 8 V 4 H 13 V 6.75')],
    ports: { in: { x: 4, y: 12 }, out: { x: 20, y: 12 }, bottom: { x: 12, y: 17 } },
  },
  motor: {
    label: 'Motor',
    category: 'rotating',
    shapes: [body(circlePath(12, 12, 8))],
    texts: [{ value: 'M', x: 12, y: 12, size: 9 }],
    ports: ROUND_PORTS,
  },
  generator: {
    label: 'Generator',
    category: 'rotating',
    shapes: [body(circlePath(12, 12, 8))],
    texts: [{ value: 'G', x: 12, y: 12, size: 9 }],
    ports: ROUND_PORTS,
  },
  fan: {
    label: 'Fan',
    category: 'rotating',
    shapes: [body(circlePath(12, 12, 8)), line(PROPELLER(12))],
    ports: ROUND_PORTS,
  },
  'heat-exchanger': {
    label: 'Heat exchanger',
    category: 'static',
    shapes: [body(circlePath(12, 12, 8)), line('M 2 12 H 7.5 L 10 8 L 14 16 L 16.5 12 H 22')],
    ports: { in: { x: 2, y: 12 }, out: { x: 22, y: 12 }, top: { x: 12, y: 4 }, bottom: { x: 12, y: 20 } },
  },
  'air-cooler': {
    label: 'Air cooler',
    category: 'static',
    shapes: [body('M 3 8 H 21 V 16 H 3 Z'), line('M 12 16 V 19.5'), line(PROPELLER(19.5)), line('M 6 4 V 5.5 M 12 4 V 5.5 M 18 4 V 5.5')],
    ports: { in: { x: 3, y: 12 }, out: { x: 21, y: 12 } },
  },
  'vertical-vessel': {
    label: 'Vertical vessel',
    category: 'static',
    shapes: [body('M 7 7 A 5 5 0 0 1 17 7 V 17 A 5 5 0 0 1 7 17 Z')],
    ports: { in: { x: 7, y: 12 }, out: { x: 17, y: 12 }, top: { x: 12, y: 2 }, bottom: { x: 12, y: 22 } },
  },
  'horizontal-separator': {
    label: 'Horizontal separator',
    category: 'static',
    shapes: [body('M 7 7 H 17 A 5 5 0 0 1 17 17 H 7 A 5 5 0 0 1 7 7 Z'), line('M 15 17 V 12.5')],
    ports: { in: { x: 2, y: 12 }, out: { x: 22, y: 12 }, top: { x: 12, y: 7 }, bottom: { x: 12, y: 17 } },
  },
  'storage-tank': {
    label: 'Storage tank',
    category: 'static',
    shapes: [body('M 4 9 L 12 5 L 20 9 V 20 H 4 Z'), line('M 4 9 H 20')],
    ports: { in: { x: 4, y: 14 }, out: { x: 20, y: 14 }, top: { x: 12, y: 5 }, bottom: { x: 12, y: 20 } },
  },
  column: {
    label: 'Column',
    category: 'static',
    shapes: [body('M 8 6 A 4 4 0 0 1 16 6 V 18 A 4 4 0 0 1 8 18 Z'), line('M 8 8.5 H 13 M 11 12 H 16 M 8 15.5 H 13')],
    ports: { in: { x: 8, y: 12 }, out: { x: 16, y: 12 }, top: { x: 12, y: 2 }, bottom: { x: 12, y: 22 } },
  },
  filter: {
    label: 'Filter',
    category: 'static',
    shapes: [body('M 5 5 H 19 V 19 H 5 Z'), dashed('M 5 19 L 19 5')],
    ports: { in: { x: 5, y: 12 }, out: { x: 19, y: 12 }, top: { x: 12, y: 5 }, bottom: { x: 12, y: 19 } },
  },
  flare: {
    label: 'Flare',
    category: 'static',
    shapes: [body('M 12 9 C 8 6.5 11.5 5 12 2 C 12.5 5 16 6.5 12 9 Z'), line('M 12 22 V 11 M 9 11 H 15 M 8 22 H 16')],
    ports: { in: { x: 12, y: 22 }, bottom: { x: 12, y: 22 } },
  },
  'gate-valve': {
    label: 'Gate valve',
    category: 'valve',
    shapes: [body(VALVE_BODY), line('M 12 15 V 6 M 8 6 H 16')],
    ports: VALVE_PORTS,
  },
  'control-valve': {
    label: 'Control valve',
    category: 'valve',
    shapes: [body(VALVE_BODY), line('M 12 15 V 8'), line('M 7 8 A 5 5 0 0 1 17 8 Z')],
    ports: VALVE_PORTS,
  },
  'check-valve': {
    label: 'Check valve',
    category: 'valve',
    shapes: [body('M 4 10 L 19 15 L 4 20 Z'), line('M 19 10 V 20')],
    ports: { in: { x: 4, y: 15 }, out: { x: 19, y: 15 } },
  },
  'shutdown-valve': {
    label: 'Shutdown valve',
    category: 'valve',
    shapes: [body(VALVE_BODY), line('M 12 15 V 9'), line('M 8 3 H 16 V 9 H 8 Z')],
    ports: VALVE_PORTS,
  },
  'relief-valve': {
    label: 'Relief valve',
    category: 'valve',
    shapes: [
      body('M 9 22 L 12 15 L 15 22 Z'),
      body('M 12 15 L 20 12 V 18 Z'),
      line('M 12 15 V 12 L 9.5 10.5 L 14.5 8.5 L 9.5 6.5 L 14.5 4.5 L 12 3'),
    ],
    ports: { in: { x: 12, y: 22 }, bottom: { x: 12, y: 22 }, out: { x: 20, y: 15 } },
  },
  instrument: {
    label: 'Instrument',
    category: 'instrument',
    shapes: [body(circlePath(12, 12, 9))],
    texts: [{ value: 'PT', x: 12, y: 12, size: 8 }],
    ports: { in: { x: 3, y: 12 }, out: { x: 21, y: 12 }, top: { x: 12, y: 3 }, bottom: { x: 12, y: 21 } },
  },
  pipe: {
    label: 'Pipe with flow direction',
    category: 'piping',
    shapes: [line('M 2 12 H 22'), solid('M 9.5 8.5 L 15.5 12 L 9.5 15.5 Z')],
    ports: { in: { x: 2, y: 12 }, out: { x: 22, y: 12 } },
  },
  transformer: {
    label: 'Transformer',
    category: 'electrical',
    shapes: [line(circlePath(12, 8.5, 5)), line(circlePath(12, 15.5, 5)), line('M 12 2 V 3.5 M 12 20.5 V 22')],
    ports: VERTICAL_PORTS,
  },
  disconnector: {
    label: 'Disconnector',
    category: 'electrical',
    shapes: [line('M 12 2 V 8 M 9.5 8 H 14.5 M 12 16 V 22 M 12 16 L 17 8.5')],
    ports: VERTICAL_PORTS,
  },
  earth: {
    label: 'Earth',
    category: 'electrical',
    shapes: [line('M 12 2 V 12 M 5.5 12 H 18.5 M 8 15.5 H 16 M 10.5 19 H 13.5')],
    ports: { top: { x: 12, y: 2 } },
  },
  inverter: {
    label: 'Inverter',
    category: 'electrical',
    shapes: [
      body('M 4 4 H 20 V 20 H 4 Z'),
      line('M 4 20 L 20 4'),
      line('M 6.5 7.5 H 11 M 6.5 10 H 11'),
      line('M 13 16.5 Q 14.25 14 15.5 16.5 T 18 16.5'),
    ],
    ports: { top: { x: 12, y: 4 }, bottom: { x: 12, y: 20 }, in: { x: 4, y: 12 }, out: { x: 20, y: 12 } },
  },
  battery: {
    label: 'Battery',
    category: 'electrical',
    shapes: [line('M 12 2 V 7 M 6 7 H 18 M 9 10.5 H 15 M 6 14 H 18 M 9 17.5 H 15 M 12 17.5 V 22')],
    ports: VERTICAL_PORTS,
  },
  'wind-turbine': {
    label: 'Wind turbine',
    category: 'electrical',
    shapes: [line('M 12 22 V 10 M 9 22 H 15 M 12 10 V 2.5 M 12 10 L 18.5 13.75 M 12 10 L 5.5 13.75'), solid(circlePath(12, 10, 1.5))],
    ports: { bottom: { x: 12, y: 22 } },
  },
  'solar-panel': {
    label: 'Solar panel',
    category: 'electrical',
    shapes: [body('M 7 6 H 21 L 17 18 H 3 Z'), line('M 14 6 L 10 18 M 5 12 H 19')],
    ports: { bottom: { x: 12, y: 18 }, top: { x: 12, y: 6 } },
  },
  load: {
    label: 'Load',
    category: 'electrical',
    shapes: [line('M 12 2 V 15'), solid('M 8 14.5 H 16 L 12 21 Z')],
    ports: { top: { x: 12, y: 2 } },
  },
};

/** Kinds in a category, in registry order. */
export function symbolsIn(category: SymbolCategory): SymbolKind[] {
  return SYMBOL_KINDS.filter((kind) => SYMBOLS[kind].category === category);
}

/**
 * Where a port of a symbol lands in a diagram, for a symbol of `size` centred on (cx, cy).
 * Falls back to the symbol centre when the symbol has no such port.
 */
export function symbolPort(kind: SymbolKind, port: SymbolPort, cx: number, cy: number, size: number): Point {
  const point = SYMBOLS[kind].ports[port];
  return point ? placePoint(point, SYMBOL_GRID, cx, cy, size) : { x: cx, y: cy };
}
