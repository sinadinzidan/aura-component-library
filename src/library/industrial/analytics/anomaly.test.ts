import { anomalyRegions, bandScores, classifyPattern, flaggedScores, rankContributors, rollingScores, scoreLevel, sensitivityThreshold } from './anomaly';

const at = (values: readonly (number | null)[]) => values.map((v, t) => ({ t, v }));
const scored = (scores: readonly number[]) => scores.map((score, t) => ({ t, score }));

describe('bandScores', () => {
  const expected = [0, 1, 2, 3, 4].map((t) => ({ t, low: 10, high: 20 }));

  it('scores 0 in the middle, 0.5 on the edge and 1 a full band-width outside', () => {
    const scores = bandScores(at([15, 20, 30, 10, 25]), expected);

    expect(scores.map((point) => point.score)).toEqual([0, 0.5, 1, 0.5, 0.75]);
  });

  it('clamps far excursions to 1', () => {
    expect(bandScores(at([500]), expected)[0].score).toBe(1);
  });

  it('scores gaps, missing bands and empty bands as 0', () => {
    expect(bandScores(at([null]), expected)[0].score).toBe(0);
    expect(bandScores([{ t: 99, v: 50 }], expected)[0].score).toBe(0);
    expect(bandScores(at([50]), [{ t: 0, low: 5, high: 5 }])[0].score).toBe(0);
  });
});

describe('rollingScores', () => {
  it('scores a jump high and the steady samples before it low', () => {
    const scores = rollingScores(at([10, 10.2, 9.8, 10.1, 9.9, 10, 14]), 6);

    expect(scores[6].score).toBe(1);
    expect(scores[5].score).toBeLessThan(0.2);
  });

  it('scores the first samples 0 because they have no history', () => {
    const scores = rollingScores(at([1, 50, 3, 4]));

    expect(scores.slice(0, 3).map((point) => point.score)).toEqual([0, 0, 0]);
  });

  it('scores a gap 0 and keeps one score per sample', () => {
    const scores = rollingScores(at([1, 2, 1, 2, null, 2]));

    expect(scores).toHaveLength(6);
    expect(scores[4].score).toBe(0);
  });

  it('does not divide by zero on a flat history', () => {
    const scores = rollingScores(at([5, 5, 5, 5, 5]));

    expect(scores[4].score).toBe(0);
  });
});

describe('sensitivityThreshold', () => {
  it('runs from the strict threshold at 0 to the loose threshold at 100', () => {
    expect(sensitivityThreshold(0)).toBe(0.95);
    expect(sensitivityThreshold(50)).toBe(0.65);
    expect(sensitivityThreshold(100)).toBe(0.35);
  });

  it('clamps the setting to 0–100', () => {
    expect(sensitivityThreshold(-20)).toBe(0.95);
    expect(sensitivityThreshold(140)).toBe(0.35);
  });

  it('takes a custom range', () => {
    expect(sensitivityThreshold(50, { strict: 1, loose: 0.5 })).toBe(0.75);
  });

  it('flags more samples as sensitivity rises', () => {
    const scores = scored([0.2, 0.4, 0.6, 0.8, 0.96]);
    const counts = [0, 50, 100].map((sensitivity) => flaggedScores(scores, sensitivityThreshold(sensitivity)).length);

    expect(counts).toEqual([1, 2, 4]);
  });
});

describe('flaggedScores', () => {
  it('keeps samples at or above the threshold', () => {
    expect(flaggedScores(scored([0.1, 0.7, 0.9]), 0.7).map((point) => point.t)).toEqual([1, 2]);
  });
});

describe('anomalyRegions', () => {
  it('groups consecutive flagged samples and records peak and count', () => {
    const regions = anomalyRegions(scored([0, 0.8, 0.9, 0, 0, 0.7, 0]), 0.7);

    expect(regions).toEqual([
      { from: 1, to: 2, peak: 0.9, count: 2 },
      { from: 5, to: 5, peak: 0.7, count: 1 },
    ]);
  });

  it('joins runs separated by no more than the bridge', () => {
    const regions = anomalyRegions(scored([0.8, 0.1, 0.9, 0, 0, 0.8]), 0.7, 1);

    expect(regions).toEqual([
      { from: 0, to: 2, peak: 0.9, count: 2 },
      { from: 5, to: 5, peak: 0.8, count: 1 },
    ]);
  });

  it('closes a region that runs to the end', () => {
    expect(anomalyRegions(scored([0, 0.9, 0.9]), 0.7)).toEqual([{ from: 1, to: 2, peak: 0.9, count: 2 }]);
  });

  it('returns nothing when no sample is flagged', () => {
    expect(anomalyRegions(scored([0.1, 0.2]), 0.7)).toEqual([]);
  });
});

describe('scoreLevel', () => {
  it('is anomalous at the threshold, elevated from 70 % of it and normal below', () => {
    expect(scoreLevel(0.7, 0.7)).toBe('anomalous');
    expect(scoreLevel(0.5, 0.7)).toBe('elevated');
    expect(scoreLevel(0.48, 0.7)).toBe('normal');
  });
});

describe('classifyPattern', () => {
  const wobble = [10, 10.4, 9.7, 10.2, 9.9, 10.3, 9.8, 10.1, 10.2, 9.9, 10.4, 9.6, 10, 10.3, 9.8, 10.1, 9.9, 10.2, 9.7, 10.1];

  it('finds a flatline at the end of a moving series', () => {
    expect(classifyPattern(at([...wobble.slice(0, 14), 10.2, 10.2, 10.2, 10.2, 10.2, 10.2]))).toBe('flatline');
  });

  it('finds a flatline in a constant series', () => {
    expect(classifyPattern(at([4, 4, 4, 4, 4, 4]))).toBe('flatline');
  });

  it('finds a single spike', () => {
    expect(classifyPattern(at(wobble.map((value, index) => (index === 11 ? 19 : value))))).toBe('spike');
  });

  it('finds a drift', () => {
    expect(classifyPattern(at(wobble.map((value, index) => value + index * 0.25)))).toBe('drift');
  });

  it('finds nothing in ordinary noise or a short series', () => {
    expect(classifyPattern(at(wobble))).toBe('none');
    expect(classifyPattern(at([1, 2, 3]))).toBe('none');
  });
});

describe('rankContributors', () => {
  it('sorts largest first and adds each share of the total', () => {
    const ranked = rankContributors([
      { id: 'a', contribution: 1 },
      { id: 'b', contribution: 3 },
    ]);

    expect(ranked).toEqual([
      { id: 'b', contribution: 3, share: 75 },
      { id: 'a', contribution: 1, share: 25 },
    ]);
  });

  it('gives a zero share when there is nothing to share', () => {
    expect(rankContributors([{ contribution: 0 }])[0].share).toBe(0);
  });
});
