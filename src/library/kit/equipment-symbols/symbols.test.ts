import { SYMBOLS, SYMBOL_GRID, SYMBOL_KINDS, circlePath, portShare, symbolsIn } from './symbols';

describe('equipment symbol set', () => {
  it('defines every kind with a label and at least one shape', () => {
    for (const kind of SYMBOL_KINDS) {
      expect(SYMBOLS[kind].label.length, kind).toBeGreaterThan(2);
      expect(SYMBOLS[kind].shapes.length, kind).toBeGreaterThan(0);
    }
  });

  it('keeps every port on the grid', () => {
    for (const kind of SYMBOL_KINDS) {
      for (const point of Object.values(SYMBOLS[kind].ports)) {
        expect(point.x, kind).toBeGreaterThanOrEqual(0);
        expect(point.x, kind).toBeLessThanOrEqual(SYMBOL_GRID);
        expect(point.y, kind).toBeLessThanOrEqual(SYMBOL_GRID);
      }
    }
  });

  it('groups kinds by category in registry order', () => {
    expect(symbolsIn('valve')).toEqual(['gate-valve', 'control-valve', 'check-valve', 'shutdown-valve', 'relief-valve']);
    expect(symbolsIn('piping')).toEqual(['pipe']);
  });

  it('gives a port as a share of the box and falls back to the centre', () => {
    expect(portShare('compressor', 'in')).toEqual({ x: 4 / 24, y: 0.5 });
    expect(portShare('earth', 'out')).toEqual({ x: 0.5, y: 0.5 });
  });

  it('draws a closed circle path', () => {
    expect(circlePath(12, 12, 8)).toBe('M 4 12 A 8 8 0 1 0 20 12 A 8 8 0 1 0 4 12 Z');
  });
});
