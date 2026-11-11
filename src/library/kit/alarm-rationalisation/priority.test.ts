import { CONSEQUENCES, URGENCIES, derivePriority, isConsequence, isUrgency, urgencyOf } from './priority';

describe(derivePriority.name, () => {
  it('gives the highest priority to severe consequences with little time', () => {
    expect(derivePriority('severe', 'under-3')).toBe('high');
    expect(derivePriority('major', 'under-3')).toBe('high');
  });

  it('says a slow, minor deviation is not an alarm', () => {
    expect(derivePriority('minor', 'over-30')).toBe('none');
    expect(derivePriority('moderate', 'over-30')).toBe('none');
  });

  it('never lowers the priority when the consequence or the urgency grows', () => {
    const rank = { none: 0, low: 1, medium: 2, high: 3 };
    CONSEQUENCES.forEach((consequence, row) => {
      URGENCIES.forEach((urgency, column) => {
        const here = rank[derivePriority(consequence, urgency)];
        if (row > 0) expect(here).toBeGreaterThanOrEqual(rank[derivePriority(CONSEQUENCES[row - 1], urgency)]);
        if (column > 0) expect(here).toBeGreaterThanOrEqual(rank[derivePriority(consequence, URGENCIES[column - 1])]);
      });
    });
  });
});

describe(urgencyOf.name, () => {
  it('classifies minutes to respond', () => {
    expect(urgencyOf(1)).toBe('under-3');
    expect(urgencyOf(3)).toBe('3-10');
    expect(urgencyOf(10)).toBe('10-30');
    expect(urgencyOf(30)).toBe('10-30');
    expect(urgencyOf(45)).toBe('over-30');
  });
});

describe('guards', () => {
  it('accept only known ids', () => {
    expect(isConsequence('major')).toBe(true);
    expect(isConsequence('huge')).toBe(false);
    expect(isUrgency('3-10')).toBe(true);
    expect(isUrgency(3)).toBe(false);
  });
});
