import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type RailEvent = {
  /** Absolute time as printed: "13:46:12". */
  time: string;
  /** Time relative to the incident: "−2 min", "T0". */
  offset?: string;
  title: string;
  detail?: string;
  /** Tag behind the event. */
  tag?: string;
  tone?: Tone;
  /** The incident itself: drawn larger and filled. */
  key?: boolean;
};

type EventRailProps = {
  /** What the sequence leads to: "Sequence of events to the trip". */
  label: string;
  events: readonly RailEvent[];
  className?: string;
};

const SQUARE_LOOKS = ['console', 'poster', 'signal', 'blueprint'];

/**
 * A sequence of events on a vertical rail: time and offset to the left, a marker on the rail, the
 * event and the tag behind it to the right. The incident itself is filled and larger so the eye
 * finds T0 first and reads backwards from it.
 */
export function EventRail({ label, events, className }: EventRailProps) {
  const look = useLook();
  const square = SQUARE_LOOKS.includes(look);

  return (
    <ol aria-label={label} data-look={look} className={cx('min-w-0 text-(--kit-text)', className)}>
      {events.map((event, index) => (
        <li key={`${event.time}-${event.title}`} data-tone={event.tone ?? 'neutral'} data-key={event.key ? '' : undefined} className="grid grid-cols-[5.5rem_1.5rem_minmax(0,1fr)] gap-x-3">
          <div className="pt-0.5 text-right">
            <div className="text-sm leading-5 font-semibold tabular-nums">{event.time}</div>
            {event.offset ? <div className="text-xs leading-4 text-(--kit-text-2) tabular-nums">{event.offset}</div> : null}
          </div>
          <div className="relative flex justify-center">
            {index < events.length - 1 ? <span aria-hidden="true" className="absolute top-3 -bottom-3 w-0.5 bg-(--kit-rule-strong)" /> : null}
            <span
              aria-hidden="true"
              className={cx(
                'relative mt-1 shrink-0 ring-4 ring-(--kit-halo)',
                square ? '' : 'rounded-full',
                event.key ? 'h-5 w-5 bg-(--t-solid)' : event.tone && event.tone !== 'neutral' ? 'mt-1.5 h-3 w-3 bg-(--t-solid)' : 'mt-1.5 h-3 w-3 border-2 border-(--kit-text-2) bg-(--kit-halo)',
              )}
            />
          </div>
          <div className={cx('min-w-0 pb-5', event.key && '-mt-1 mb-4 rounded-(--kit-radius-sm) bg-(--t-soft) px-3 py-2 pb-2')}>
            <div className={cx('text-sm leading-5', event.key ? 'font-semibold' : 'font-medium')}>{event.title}</div>
            {event.detail || event.tag ? (
              <div className="text-xs leading-4 text-(--kit-text-2) tabular-nums">
                {event.tag ? <span className="font-medium text-(--kit-text)">{event.tag}</span> : null}
                {event.tag && event.detail ? ' · ' : null}
                {event.detail}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
