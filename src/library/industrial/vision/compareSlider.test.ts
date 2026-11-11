import { afterClipPath, clampDivider, dividerAfterKey, dividerFromPointer, dividerPercent } from './compareSlider';

describe('compare slider', () => {
  it('clamps the divider', () => {
    expect(clampDivider(-1)).toBe(0);
    expect(clampDivider(3)).toBe(1);
  });

  it('follows the pointer within the frame', () => {
    expect(dividerFromPointer(150, 100, 200)).toBe(0.25);
    expect(dividerFromPointer(50, 100, 200)).toBe(0);
    expect(dividerFromPointer(900, 100, 200)).toBe(1);
    expect(dividerFromPointer(10, 0, 0)).toBe(0.5);
  });

  it('steps with the arrow keys and larger with shift or page keys', () => {
    expect(dividerAfterKey(0.5, 'ArrowRight')).toBeCloseTo(0.52);
    expect(dividerAfterKey(0.5, 'ArrowLeft')).toBeCloseTo(0.48);
    expect(dividerAfterKey(0.5, 'ArrowRight', true)).toBeCloseTo(0.6);
    expect(dividerAfterKey(0.5, 'PageUp')).toBeCloseTo(0.6);
    expect(dividerAfterKey(0.5, 'PageDown')).toBeCloseTo(0.4);
    expect(dividerAfterKey(0.5, 'ArrowUp')).toBeCloseTo(0.52);
    expect(dividerAfterKey(0.5, 'ArrowDown')).toBeCloseTo(0.48);
  });

  it('jumps to the ends and ignores other keys', () => {
    expect(dividerAfterKey(0.5, 'Home')).toBe(0);
    expect(dividerAfterKey(0.5, 'End')).toBe(1);
    expect(dividerAfterKey(0.5, 'a')).toBeNull();
    expect(dividerAfterKey(0.99, 'ArrowRight', true)).toBe(1);
  });

  it('clips the after layer to the right of the divider', () => {
    expect(afterClipPath(0.25)).toBe('inset(0 0 0 25%)');
    expect(afterClipPath(2)).toBe('inset(0 0 0 100%)');
  });

  it('reports whole percent', () => {
    expect(dividerPercent(0.4567)).toBe(46);
  });
});
