import { matchesConfirmation } from './matchesConfirmation';

describe(matchesConfirmation.name, () => {
  it('matches the exact text', () => {
    expect(matchesConfirmation('23-KA-9103', '23-KA-9103')).toBe(true);
  });

  it('ignores surrounding spaces', () => {
    expect(matchesConfirmation('  23-KA-9103 ', '23-KA-9103')).toBe(true);
  });

  it('rejects a partial or empty entry', () => {
    expect(matchesConfirmation('23-KA-910', '23-KA-9103')).toBe(false);
    expect(matchesConfirmation('', '23-KA-9103')).toBe(false);
  });

  it('is case-sensitive unless told otherwise', () => {
    expect(matchesConfirmation('23-ka-9103', '23-KA-9103')).toBe(false);
    expect(matchesConfirmation('23-ka-9103', '23-KA-9103', true)).toBe(true);
  });
});
