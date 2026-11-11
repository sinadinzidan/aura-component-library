import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type TimelineEvent = {
  id: string;
  /** Clock time, already formatted. */
  time: string;
  title: string;
  /** Who or what, and any value: "Ingrid Haugen · 11.6 mm/s". */
  detail?: string;
  tone: Tone;
  icon: ReactNode;
  /** The kind of event as a word: "Alarm", "Operator", "System". */
  kind: string;
};

/** Looks that set the time as a column of large figures instead of a rail with nodes. */
const TIME_FIRST: Record<LookId, boolean> = {
  studio: false,
  console: true,
  poster: true,
  glass: false,
  editorial: true,
  soft: false,
  blueprint: true,
  signal: false,
};

type EventTimelineProps = {
  /** Accessible name, for example "Events on the recompressor, last hour". */
  label: string;
  events: readonly TimelineEvent[];
  className?: string;
};

/**
 * What happened, in order. A rail with icon nodes in the card looks; a ledger with the time in
 * its own column in console, editorial and blueprint, where the clock is what people scan.
 */
export function EventTimeline({ label, events, className }: EventTimelineProps) {
  const look = useLook();
  const ledger = TIME_FIRST[look];

  if (ledger) {
    return (
      <ol aria-label={label} data-look={look} className={cx('flex flex-col text-sm text-[var(--kit-text)]', className)}>
        {events.map((event) => (
          <li key={event.id} data-tone={event.tone} className="grid grid-cols-[4rem_6.5rem_minmax(0,1fr)] items-baseline gap-x-3 border-b border-[var(--kit-rule)] py-2.5 last:border-b-0">
            <span className={cx('font-semibold tabular-nums', look === 'editorial' || look === 'poster' ? 'text-lg leading-6' : '')}>{event.time}</span>
            <span className="flex items-center gap-1.5 self-center font-medium text-[var(--t-ink)] [&>svg]:size-4 [&>svg]:shrink-0">
              {event.icon}
              {event.kind}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="leading-5 font-medium">{event.title}</span>
              {event.detail ? <span className="text-[0.8125rem] leading-5 text-[var(--kit-text-2)]">{event.detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol aria-label={label} data-look={look} className={cx('flex flex-col text-sm text-[var(--kit-text)]', className)}>
      {events.map((event, index) => (
        <li key={event.id} data-tone={event.tone} className="relative flex gap-3 pb-5 last:pb-0">
          {index < events.length - 1 ? <span aria-hidden="true" className="absolute top-9 bottom-0 left-4.5 w-px bg-[var(--kit-rule-strong)]" /> : null}
          <span
            className={cx(
              'flex size-9 shrink-0 items-center justify-center rounded-full [&>svg]:size-4.5',
              look === 'signal' ? 'bg-[var(--t-solid)] text-[var(--t-on-solid)]' : 'bg-[var(--t-soft)] text-[var(--t-on-soft)]'
            )}
          >
            {event.icon}
          </span>
          <span className="flex min-w-0 flex-1 flex-col pt-0.5">
            <span className="flex items-baseline justify-between gap-3">
              <span className="leading-5 font-semibold">{event.title}</span>
              <span className="shrink-0 font-medium text-[var(--kit-text-2)] tabular-nums">{event.time}</span>
            </span>
            <span className="text-[0.8125rem] leading-5 text-[var(--kit-text-2)]">
              {event.kind}
              {event.detail ? ` · ${event.detail}` : ''}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
