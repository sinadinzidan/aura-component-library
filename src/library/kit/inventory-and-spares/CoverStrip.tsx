import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { coverVerdict, daysOfCover } from './stock';

type CoverStripProps = {
  /** What is consumed: "Methanol". */
  label: string;
  onHand: number;
  dailyUse: number;
  unit: string;
  /** Days a new delivery takes. */
  leadTimeDays: number;
  /** Days drawn on the strip. */
  horizonDays?: number;
  className?: string;
};

const SQUARE_LOOKS = ['console', 'poster', 'blueprint', 'signal'];

/**
 * Days of cover as a calendar strip: one cell per day ahead, filled for as long as the stock
 * lasts at the current use, with the delivery lead time marked. It answers "do we run out before
 * the next delivery can arrive" at a glance.
 */
export function CoverStrip({ label, onHand, dailyUse, unit, leadTimeDays, horizonDays = 28, className }: CoverStripProps) {
  const look = useLook();
  const days = daysOfCover(onHand, dailyUse);
  const verdict = coverVerdict(days, leadTimeDays);
  const shown = Number.isFinite(days) ? formatNumber(days) : `${horizonDays}+`;
  const square = SQUARE_LOOKS.includes(look);

  return (
    <div
      role="img"
      aria-label={`${label}: ${shown} days of cover, lead time ${leadTimeDays} days, ${verdict.word.toLowerCase()}`}
      data-look={look}
      data-tone={verdict.tone}
      className={cx('min-w-0 text-(--kit-text)', className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-(--kit-text-2) tabular-nums">
          <span className="text-lg leading-6 font-semibold text-(--kit-text)">{shown}</span> days of cover
        </span>
      </div>
      <div aria-hidden="true" className="mt-2 flex gap-0.5">
        {Array.from({ length: horizonDays }, (_, day) => (
          <span
            key={day}
            data-covered={day < days ? '' : undefined}
            className={cx(
              'h-5 min-w-0 flex-1',
              square ? '' : 'rounded-sm',
              day < days ? 'bg-(--t-solid)' : 'bg-(--kit-track) ring-1 ring-(--kit-rule) ring-inset',
              day === leadTimeDays - 1 ? 'mr-1.5' : '',
            )}
          />
        ))}
      </div>
      <p className="mt-2 flex flex-wrap justify-between gap-x-3 text-xs text-(--kit-text-2) tabular-nums">
        <span className="font-semibold text-(--t-ink)">{verdict.word}</span>
        <span>
          {formatNumber(onHand)} {unit} on hand · {formatNumber(dailyUse, 1)} {unit} a day · delivery takes {leadTimeDays} days
        </span>
      </p>
    </div>
  );
}
