import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

export type DaysCounter = { label: string; days: number };

type DaysSinceBannerProps = {
  days: number;
  /** What has not happened for that long: "days since the last recordable incident". */
  label: string;
  /** The longest run so far; the progress bar runs to it. */
  record: number;
  /** One line about the last event. */
  lastEvent?: string;
  /** Smaller counters beside the main one. */
  counters?: readonly DaysCounter[];
  /** Start of the banner: the site name or a mark. */
  lead?: ReactNode;
  tone?: Tone;
  className?: string;
};

/**
 * The days-since counter as a banner: one enormous number in a tile filled with its state, the
 * run measured against the site record, and the lesser counters beside it.
 */
export function DaysSinceBanner({ days, label, record, lastEvent, counters = [], lead, tone = 'success', className }: DaysSinceBannerProps) {
  const look = useLook();
  const share = Math.min(days / Math.max(record, 1), 1) * 100;

  return (
    <section
      aria-label={`${formatNumber(days)} ${label}`}
      data-look={look}
      data-tone={tone}
      className={cx('flex min-w-0 flex-wrap items-stretch gap-x-10 gap-y-4 rounded-(--kit-radius) bg-(--t-vivid) px-7 py-5 text-(--t-on-vivid)', className)}
    >
      <div className="flex min-w-0 flex-1 items-center gap-6">
        <p className="text-[8.5rem] leading-[0.8] font-extrabold tracking-tighter tabular-nums">{formatNumber(days)}</p>
        <div className="min-w-0 flex-1">
          {lead ? <div className="mb-1 text-base font-semibold">{lead}</div> : null}
          <p className="text-3xl leading-tight font-extrabold tracking-tight">{label}</p>
          {lastEvent ? <p className="mt-1 text-base font-medium">{lastEvent}</p> : null}
          <div className="mt-3 max-w-md">
            <div
              role="meter"
              aria-label="Run against the site record"
              aria-valuemin={0}
              aria-valuemax={record}
              aria-valuenow={Math.min(days, record)}
              aria-valuetext={`${days} of ${record} days`}
              className="h-3 overflow-hidden rounded-(--kit-radius-sm)"
              style={{ background: 'color-mix(in oklab, currentColor 22%, transparent)' }}
            >
              <div className="h-full bg-current" style={{ width: `${share}%` }} />
            </div>
            <p className="mt-1 flex justify-between text-sm font-semibold tabular-nums">
              <span>{Math.round(share)} % of the record</span>
              <span>Record {formatNumber(record)} days</span>
            </p>
          </div>
        </div>
      </div>
      {counters.length > 0 ? (
        <dl className="flex items-stretch gap-6 border-l-2 pl-8" style={{ borderColor: 'color-mix(in oklab, currentColor 30%, transparent)' }}>
          {counters.map((counter) => (
            <div key={counter.label} className="flex w-32 flex-col justify-center">
              <dd className="text-5xl leading-none font-extrabold tracking-tight tabular-nums">{formatNumber(counter.days)}</dd>
              <dt className="mt-1.5 text-sm leading-5 font-semibold">{counter.label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
