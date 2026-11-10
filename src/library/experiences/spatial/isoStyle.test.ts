import { ISO_EDGE, ISO_EDGE_GHOST, ISO_EDGE_OUTLINED, ISO_TONE, isoEdgeClass, isoToneFromStatus } from './isoStyle';

describe('isoToneFromStatus', () => {
  it('maps every status tone to an isometric tone that sets the colour variable', () => {
    for (const tone of ['neutral', 'success', 'warning', 'critical', 'info'] as const) {
      expect(ISO_TONE[isoToneFromStatus(tone)]).toContain('--iso:var(--');
    }
  });
});

describe('isoEdgeClass', () => {
  it('uses the body edge for a solid and a faint edge for a ghost', () => {
    expect(isoEdgeClass('solid', false)).toBe(ISO_EDGE);
    expect(isoEdgeClass('ghost', false)).toBe(ISO_EDGE_GHOST);
  });

  it('lets the outline win over the variant', () => {
    expect(isoEdgeClass('solid', true)).toBe(ISO_EDGE_OUTLINED);
    expect(isoEdgeClass('ghost', true)).toBe(ISO_EDGE_OUTLINED);
  });
});
