import { cn } from '../../../lib/utils';
import { toFraction } from '../geometry';
import { LABEL_TEXT, SCALE_TEXT, TONE_MARK_BG, formatValue } from '../status';
import type { Tone } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

import { coverTone, daysOfCover } from './inventory';

export type DaysOfCoverProps = {
  /** The item. Shown above the bar and used in the accessible name. */
  label: string;
  onHand: number;
  /** Average consumption per day, in the same unit as `onHand`. */
  dailyUse: number;
  /** Days from order to delivery; cover shorter than this is a stock-out waiting to happen. */
  leadTimeDays: number;
  /** End of the bar's scale in days. Defaults to three lead times. */
  horizonDays?: number;
  /** `bar` draws cover against the lead time; `inline` is a number and a caption for table rows. */
  variant?: 'bar' | 'inline';
  className?: string;
};

const VERDICT: Record<Tone, { label: string; shape: 'diamond' | 'square' } | undefined> = {
  critical: { label: 'Shorter than lead time', shape: 'diamond' },
  warning: { label: 'Close to lead time', shape: 'square' },
  neutral: undefined,
  success: undefined,
  info: undefined,
};

/**
 * How long the stock lasts at the current consumption, judged against how long a new delivery
 * takes. Neutral while there is room; warning and critical say why in words.
 */
export function DaysOfCover({ label, onHand, dailyUse, leadTimeDays, horizonDays, variant = 'bar', className }: DaysOfCoverProps) {
  const days = daysOfCover(onHand, dailyUse);
  const tone = coverTone(days, leadTimeDays);
  const verdict = VERDICT[tone];
  const shown = days === null ? null : Math.floor(days);
  const name =
    days === null
      ? `${label}: no consumption, cover not limited`
      : `${label}: ${formatValue(shown, 0)} days of cover, lead time ${formatValue(leadTimeDays, 0)} days${verdict ? `, ${verdict.label.toLowerCase()}` : ''}`;

  if (variant === 'inline') {
    return (
      <span data-slot="days-of-cover" data-tone={tone} role="img" aria-label={name} className={cn('inline-flex items-baseline gap-2 whitespace-nowrap', className)}>
        {days === null ? <span className="text-sm text-muted-foreground">No consumption</span> : <ValueReadout size="xs" value={shown} unit="d" tone={tone} />}
        {verdict ? <StatusIndicator size="sm" tone={tone} label={verdict.label} shape={verdict.shape} /> : null}
      </span>
    );
  }

  const horizon = horizonDays ?? leadTimeDays * 3;

  return (
    <div data-slot="days-of-cover" data-tone={tone} className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn(LABEL_TEXT, 'truncate')}>{label}</span>
        {days === null ? <span className="text-sm text-muted-foreground">No consumption</span> : <ValueReadout size="sm" value={shown} unit="d of cover" tone={tone} />}
      </div>
      <div role="img" aria-label={name} className="relative">
        <div className="h-2 overflow-hidden rounded-full bg-chart-neutral-100">
          <div data-slot="cover-fill" className={cn('h-full rounded-full', TONE_MARK_BG[tone])} style={{ width: `${toFraction(days ?? horizon, 0, horizon) * 100}%` }} />
        </div>
        <span data-slot="cover-lead-time" className="absolute -top-1 h-4 w-px bg-base-foreground" style={{ left: `${toFraction(leadTimeDays, 0, horizon) * 100}%` }} />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className={SCALE_TEXT}>Lead time {formatValue(leadTimeDays, 0)} d</span>
        {verdict ? <StatusIndicator size="sm" tone={tone} label={verdict.label} shape={verdict.shape} /> : null}
      </div>
    </div>
  );
}
