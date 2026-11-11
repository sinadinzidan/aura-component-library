import { describe, expect, it } from 'vitest';

import { fitScale } from './fitScale';

describe(fitScale.name, () => {
  it('keeps the natural size when the container is at least the design width', () => {
    expect(fitScale(1400, 1152)).toEqual({ scale: 1, width: null });
    expect(fitScale(1152, 1152)).toEqual({ scale: 1, width: null });
  });

  it('lays out at the design width and scales down in a narrower container', () => {
    expect(fitScale(576, 1152)).toEqual({ scale: 0.5, width: 1152 });
  });

  it('does not scale before the container has been measured', () => {
    expect(fitScale(null, 1152)).toEqual({ scale: 1, width: null });
    expect(fitScale(0, 1152)).toEqual({ scale: 1, width: null });
  });
});
