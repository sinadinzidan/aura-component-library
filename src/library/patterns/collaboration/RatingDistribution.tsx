import { summarizeRatings } from './ratingSummary';
import type { RatingCount } from './ratingSummary';

type RatingDistributionProps = {
  /** Accessible name of the breakdown: "Ratings for the vibration dashboard". */
  label: string;
  counts: readonly RatingCount[];
  /** The top of the scale, shown after the average: "4.1 of 5". */
  max?: number;
  /** A word per score for the rows: `{ 5: 'Excellent' }`. The score number is used otherwise. */
  scoreLabels?: Readonly<Record<number, string>>;
  /** What is counted, singular and plural. */
  noun?: { one: string; other: string };
};

const AVERAGE = new Intl.NumberFormat('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const COUNT = new Intl.NumberFormat('en-US');

/**
 * A rating summary: the average and number of ratings on the left, and one bar per score, highest
 * first, with its count. Every bar uses the same data colour, because a low score is information
 * here, not an alarm. Before anyone has rated it shows a dash, not a zero.
 */
export function RatingDistribution({
  label,
  counts,
  max = 5,
  scoreLabels,
  noun = { one: 'rating', other: 'ratings' },
}: RatingDistributionProps) {
  const summary = summarizeRatings(counts);

  return (
    <div data-slot="rating-distribution" className="flex w-full min-w-0 items-start gap-6">
      <div className="flex shrink-0 flex-col gap-1">
        <span className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tabular-nums text-base-foreground">
            {summary.average === null ? '—' : AVERAGE.format(summary.average)}
          </span>
          <span className="text-sm text-muted-foreground">of {max}</span>
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {summary.total === 0 ? `No ${noun.other} yet` : `${COUNT.format(summary.total)} ${summary.total === 1 ? noun.one : noun.other}`}
        </span>
      </div>
      <ul aria-label={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
        {summary.rows.map((row) => (
          <li key={row.score} className="grid grid-cols-[auto_minmax(0,1fr)_2.5rem] items-center gap-x-3 text-sm">
            <span className={`text-medium-foreground tabular-nums ${scoreLabels ? 'w-20' : 'w-3 text-right'}`}>
              {scoreLabels?.[row.score] ?? row.score}
            </span>
            <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-muted-background">
              <span data-slot="rating-bar" className="block h-full rounded-full bg-chart-1-450" style={{ width: `${row.share}%` }} />
            </span>
            <span className="text-right tabular-nums text-muted-foreground">{COUNT.format(row.count)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
