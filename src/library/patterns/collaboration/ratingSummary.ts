/** How many people gave one score. */
export type RatingCount = { score: number; count: number };

export type RatingSummary = {
  total: number;
  /** Mean score, or `null` when nobody has rated yet. */
  average: number | null;
  /** One row per score, highest score first, with its share of all ratings in percent. */
  rows: { score: number; count: number; share: number }[];
};

/** Total, mean and per-score shares for a rating distribution. Negative counts count as zero. */
export function summarizeRatings(counts: readonly RatingCount[]): RatingSummary {
  const clean = counts.map((entry) => ({ score: entry.score, count: Math.max(0, entry.count) }));
  const total = clean.reduce((sum, entry) => sum + entry.count, 0);
  const weighted = clean.reduce((sum, entry) => sum + entry.score * entry.count, 0);

  return {
    total,
    average: total > 0 ? weighted / total : null,
    rows: [...clean]
      .sort((a, b) => b.score - a.score)
      .map((entry) => ({ ...entry, share: total > 0 ? (entry.count / total) * 100 : 0 })),
  };
}

/**
 * Net promoter score from 0–10 answers: the share of promoters (9–10) minus the share of
 * detractors (0–6), rounded to a whole number between -100 and 100. `null` without answers.
 */
export function netPromoterScore(counts: readonly RatingCount[]): number | null {
  const { total, rows } = summarizeRatings(counts);
  if (total === 0) return null;
  const promoters = rows.filter((row) => row.score >= 9).reduce((sum, row) => sum + row.count, 0);
  const detractors = rows.filter((row) => row.score <= 6).reduce((sum, row) => sum + row.count, 0);
  return Math.round(((promoters - detractors) / total) * 100);
}
