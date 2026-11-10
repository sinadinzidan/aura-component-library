import { netPromoterScore, summarizeRatings } from './ratingSummary';

describe(summarizeRatings.name, () => {
  const counts = [
    { score: 1, count: 2 },
    { score: 2, count: 0 },
    { score: 3, count: 4 },
    { score: 4, count: 10 },
    { score: 5, count: 4 },
  ];

  it('totals the ratings', () => {
    expect(summarizeRatings(counts).total).toBe(20);
  });

  it('computes the mean score', () => {
    expect(summarizeRatings(counts).average).toBeCloseTo(3.7, 5);
  });

  it('lists scores highest first with their share', () => {
    const { rows } = summarizeRatings(counts);

    expect(rows.map((row) => row.score)).toEqual([5, 4, 3, 2, 1]);
    expect(rows.map((row) => row.share)).toEqual([20, 50, 20, 0, 10]);
  });

  it('has no average and zero shares before anyone has rated', () => {
    const summary = summarizeRatings([{ score: 5, count: 0 }]);

    expect(summary.average).toBeNull();
    expect(summary.rows[0].share).toBe(0);
  });

  it('counts a negative count as zero', () => {
    expect(summarizeRatings([{ score: 5, count: -3 }]).total).toBe(0);
  });
});

describe(netPromoterScore.name, () => {
  it('subtracts the share of detractors from the share of promoters', () => {
    const score = netPromoterScore([
      { score: 10, count: 5 },
      { score: 9, count: 1 },
      { score: 8, count: 2 },
      { score: 6, count: 1 },
      { score: 0, count: 1 },
    ]);

    expect(score).toBe(40);
  });

  it('is -100 when everyone is a detractor', () => {
    expect(netPromoterScore([{ score: 3, count: 4 }])).toBe(-100);
  });

  it('is null without answers', () => {
    expect(netPromoterScore([])).toBeNull();
  });
});
