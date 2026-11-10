import { SYMBOL_FILL_OPACITY, SYMBOL_TONE_TEXT, breakerStatus, runStateAppearance, symbolFrame, valvePositionStatus } from './symbolState';

describe('symbolState', () => {
  describe(runStateAppearance.name, () => {
    it('keeps normal states grey and tells them apart by fill', () => {
      expect(runStateAppearance('running')).toEqual({ tone: 'neutral', fill: 'solid', dashed: false });
      expect(runStateAppearance('standby')).toEqual({ tone: 'neutral', fill: 'soft', dashed: false });
      expect(runStateAppearance('stopped')).toEqual({ tone: 'neutral', fill: 'none', dashed: false });
    });

    it('reserves colour for abnormal states', () => {
      expect(runStateAppearance('tripped').tone).toBe('critical');
      expect(runStateAppearance('maintenance')).toEqual({ tone: 'warning', fill: 'none', dashed: true });
    });
  });

  describe(valvePositionStatus.name, () => {
    it('labels every position', () => {
      expect(valvePositionStatus('open')).toEqual({ tone: 'neutral', label: 'Open', shape: 'ring' });
      expect(valvePositionStatus('closed')).toEqual({ tone: 'neutral', label: 'Closed', shape: 'dot' });
      expect(valvePositionStatus('travelling').label).toBe('Travelling');
    });

    it('marks a failed valve critical', () => {
      expect(valvePositionStatus('failed')).toEqual({ tone: 'critical', label: 'Failed', shape: 'diamond' });
    });
  });

  describe(breakerStatus.name, () => {
    it('keeps closed and open neutral with different shapes', () => {
      expect(breakerStatus('closed')).toEqual({ tone: 'neutral', label: 'Closed', shape: 'square' });
      expect(breakerStatus('open')).toEqual({ tone: 'neutral', label: 'Open', shape: 'ring' });
    });

    it('marks a trip critical', () => {
      expect(breakerStatus('tripped').tone).toBe('critical');
    });
  });

  describe(symbolFrame.name, () => {
    it('turns a named size into a utility class', () => {
      expect(symbolFrame('md')).toEqual({ className: 'size-8' });
    });

    it('uses a custom class map when given', () => {
      expect(symbolFrame('sm', undefined, undefined, { sm: 'size-10', md: 'size-12', lg: 'size-14' })).toEqual({ className: 'size-10' });
    });

    it('sizes a numeric symbol in diagram units', () => {
      expect(symbolFrame(40)).toEqual({ width: 40, height: 40 });
    });

    it('centres a nested symbol on its position', () => {
      expect(symbolFrame(40, 100, 60)).toEqual({ x: 80, y: 40, width: 40, height: 40 });
    });
  });

  it('fills more strongly at each level', () => {
    expect(SYMBOL_FILL_OPACITY.none).toBe(0);
    expect(SYMBOL_FILL_OPACITY.soft).toBeLessThan(SYMBOL_FILL_OPACITY.solid);
    expect(SYMBOL_FILL_OPACITY.full).toBe(1);
  });

  it('draws neutral equipment in mid grey and abnormal states in status colour', () => {
    expect(SYMBOL_TONE_TEXT.neutral).toBe('text-medium-foreground');
    expect(SYMBOL_TONE_TEXT.critical).toBe('text-critical-foreground-strong');
  });
});
