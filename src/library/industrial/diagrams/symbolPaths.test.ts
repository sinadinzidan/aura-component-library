import { SYMBOLS, SYMBOL_GRID, SYMBOL_KINDS, VALVE_BODY, VALVE_BODY_UPSTREAM, VALVE_FAULT_MARK, symbolPort, symbolsIn } from './symbolPaths';
import type { SymbolKind } from './symbolPaths';

/** Every number in a path, including arc flags, which are 0 or 1 and so always inside the grid. */
function numbersIn(path: string): number[] {
  return (path.match(/-?\d*\.?\d+/g) ?? []).map(Number);
}

const REQUIRED: readonly SymbolKind[] = [
  'centrifugal-pump',
  'pd-pump',
  'compressor',
  'gas-turbine',
  'motor',
  'generator',
  'heat-exchanger',
  'air-cooler',
  'vertical-vessel',
  'horizontal-separator',
  'storage-tank',
  'column',
  'gate-valve',
  'control-valve',
  'check-valve',
  'shutdown-valve',
  'relief-valve',
  'fan',
  'filter',
  'flare',
  'instrument',
  'pipe',
];

describe('symbolPaths', () => {
  it('defines every kind exactly once', () => {
    expect(Object.keys(SYMBOLS).sort()).toEqual([...SYMBOL_KINDS].sort());
    expect(new Set(SYMBOL_KINDS).size).toBe(SYMBOL_KINDS.length);
  });

  it('covers the required process set', () => {
    for (const kind of REQUIRED) {
      expect(SYMBOL_KINDS, kind).toContain(kind);
    }
  });

  it('gives every symbol a unique label', () => {
    const labels = SYMBOL_KINDS.map((kind) => SYMBOLS[kind].label);

    expect(labels.every((label) => label.length > 2)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it.each(SYMBOL_KINDS)('%s has drawable paths that start with a move', (kind) => {
    const { shapes } = SYMBOLS[kind];

    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of shapes) {
      expect(shape.d).toMatch(/^M /);
    }
  });

  it.each(SYMBOL_KINDS)('%s stays inside the grid', (kind) => {
    for (const shape of SYMBOLS[kind].shapes) {
      for (const value of numbersIn(shape.d)) {
        expect(value, shape.d).toBeGreaterThanOrEqual(0);
        expect(value, shape.d).toBeLessThanOrEqual(SYMBOL_GRID);
      }
    }
  });

  it.each(SYMBOL_KINDS)('%s closes every fillable path', (kind) => {
    for (const shape of SYMBOLS[kind].shapes.filter((candidate) => candidate.role !== 'line')) {
      expect(shape.d.trim()).toMatch(/Z$/);
    }
  });

  it.each(SYMBOL_KINDS)('%s has at least one port inside the grid', (kind) => {
    const ports = Object.values(SYMBOLS[kind].ports);

    expect(ports.length).toBeGreaterThan(0);
    for (const port of ports) {
      expect(port.x).toBeGreaterThanOrEqual(0);
      expect(port.x).toBeLessThanOrEqual(SYMBOL_GRID);
      expect(port.y).toBeGreaterThanOrEqual(0);
      expect(port.y).toBeLessThanOrEqual(SYMBOL_GRID);
    }
  });

  it('keeps letters inside the grid', () => {
    for (const kind of SYMBOL_KINDS) {
      for (const text of SYMBOLS[kind].texts ?? []) {
        expect(text.x).toBeGreaterThan(0);
        expect(text.x).toBeLessThan(SYMBOL_GRID);
        expect(text.y).toBeGreaterThan(0);
        expect(text.y).toBeLessThan(SYMBOL_GRID);
      }
    }
  });

  it('gives in-line process symbols an inlet and an outlet', () => {
    const inline: readonly SymbolKind[] = ['centrifugal-pump', 'compressor', 'heat-exchanger', 'horizontal-separator', 'gate-valve', 'control-valve', 'filter', 'pipe'];

    for (const kind of inline) {
      expect(SYMBOLS[kind].ports.in, kind).toBeDefined();
      expect(SYMBOLS[kind].ports.out, kind).toBeDefined();
    }
  });

  it('shares one valve body between the actuated valves', () => {
    for (const kind of ['gate-valve', 'control-valve', 'shutdown-valve'] as const) {
      expect(SYMBOLS[kind].shapes[0]).toEqual({ d: VALVE_BODY, role: 'body' });
    }
    expect(VALVE_BODY_UPSTREAM).toMatch(/Z$/);
    expect(VALVE_FAULT_MARK).toMatch(/^M /);
  });

  describe(symbolsIn.name, () => {
    it('lists the kinds of a category in registry order', () => {
      expect(symbolsIn('valve')).toEqual(['gate-valve', 'control-valve', 'check-valve', 'shutdown-valve', 'relief-valve']);
    });

    it('puts every kind in exactly one category', () => {
      const categories = ['rotating', 'static', 'valve', 'instrument', 'piping', 'electrical'] as const;

      expect(categories.flatMap((category) => symbolsIn(category)).sort()).toEqual([...SYMBOL_KINDS].sort());
    });
  });

  describe(symbolPort.name, () => {
    it('places a port in diagram units', () => {
      expect(symbolPort('centrifugal-pump', 'out', 100, 50, 48)).toEqual({ x: 116, y: 50 });
    });

    it('follows a port that is off the centre line', () => {
      expect(symbolPort('control-valve', 'in', 100, 50, 24)).toEqual({ x: 92, y: 53 });
    });

    it('falls back to the centre for a missing port', () => {
      expect(symbolPort('earth', 'bottom', 100, 50, 24)).toEqual({ x: 100, y: 50 });
    });
  });
});
