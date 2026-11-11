import { describe, expect, it } from 'vitest';

import { fittingLabel, labelFontSize } from './sunburstLabel';

describe(fittingLabel.name, () => {
  it('prefers the full label, then the short one, then nothing', () => {
    expect(fittingLabel({ label: 'Gas compression', short: 'NK-23' }, 200, 60)).toBe('Gas compression');
    expect(fittingLabel({ label: 'Gas compression', short: 'NK-23' }, 70, 60)).toBe('NK-23');
    expect(fittingLabel({ label: 'Gas compression', short: 'NK-23' }, 30, 60)).toBeNull();
    expect(fittingLabel({ label: 'Gas compression' }, 70, 60)).toBeNull();
  });

  it('prints nothing on a ring thinner than the text', () => {
    expect(fittingLabel({ label: 'A' }, 200, 12)).toBeNull();
  });
});

describe(labelFontSize.name, () => {
  it('keeps the full-size font on a chart drawn at full size or larger', () => {
    expect(labelFontSize(680)).toBe(14);
    expect(labelFontSize(900)).toBe(14);
  });

  it('grows the font on a chart drawn small, so labels stay readable', () => {
    expect(labelFontSize(380)).toBe(22);
    expect(labelFontSize(520)).toBe(16);
  });

  it('falls back to the full-size font for a nonsense size', () => {
    expect(labelFontSize(0)).toBe(14);
  });

  it('needs more room for a larger font', () => {
    expect(fittingLabel({ label: 'Compressor' }, 100, 60, 14)).toBe('Compressor');
    expect(fittingLabel({ label: 'Compressor' }, 100, 60, 22)).toBeNull();
  });
});
