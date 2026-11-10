import { hourAngle, polarPoint, spoke } from './polar';

export type TimeRingEvent = {
  id: string;
  /** Clock hour, 0–24, fractions allowed. */
  hour: number;
  kind: 'trip' | 'alarm' | 'note';
  label: string;
};

export type TimeRingProps = {
  cx: number;
  cy: number;
  /** Radius of the ring line. Ticks point inwards, labels sit outside. */
  radius: number;
  events?: readonly TimeRingEvent[];
  /** Clock hour of the scrub cursor. */
  cursorHour?: number;
  /** Clock hour of "now", marked on the ring. */
  nowHour?: number;
  /** A numbered tick every this many hours. */
  labelEvery?: number;
  className?: string;
};

const EVENT_CLASS: Record<TimeRingEvent['kind'], string> = {
  trip: 'fill-critical-foreground-strong stroke-critical-foreground-strong',
  alarm: 'fill-warning-foreground-strong stroke-warning-foreground-strong',
  note: 'fill-none stroke-info-foreground-strong',
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function eventPath(kind: TimeRingEvent['kind'], size: number): string {
  if (kind === 'trip') return `M 0 ${-size} L ${size} 0 L 0 ${size} L ${-size} 0 Z`;
  if (kind === 'alarm') return `M 0 ${-size} L ${size} ${size * 0.8} L ${-size} ${size * 0.8} Z`;
  return `M ${-size * 0.8} 0 a ${size * 0.8} ${size * 0.8} 0 1 0 ${size * 1.6} 0 a ${size * 0.8} ${size * 0.8} 0 1 0 ${-size * 1.6} 0 Z`;
}

function pad(hour: number): string {
  return String(hour).padStart(2, '0');
}

/**
 * A 24-hour clock ring for the bezel of a dial: hour ticks, events as shaped marks at the time
 * they happened (diamond for a trip, triangle for an alarm, ring for a note), the word Now in
 * place of the hour it falls on, and a cursor for the hour being replayed. It is an SVG fragment. Pick it when the day's
 * events should frame a dial instead of taking a separate timeline.
 */
export function TimeRing({ cx, cy, radius, events = [], cursorHour, nowHour, labelEvery = 3, className }: TimeRingProps) {
  const cursor = cursorHour === undefined ? undefined : spoke(cx, cy, radius - 12, radius + 5, hourAngle(cursorHour));
  const cursorKnob = cursorHour === undefined ? undefined : polarPoint(cx, cy, radius, hourAngle(cursorHour));
  const now = nowHour === undefined ? undefined : polarPoint(cx, cy, radius + 14, hourAngle(nowHour));

  return (
    <g data-slot="time-ring" className={className}>
      <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth={1} className="stroke-[color-mix(in_oklab,var(--primary-background)_45%,transparent)]" />
      {HOURS.map((hour) => {
        const major = hour % labelEvery === 0;
        const tick = spoke(cx, cy, radius - (major ? 9 : 5), radius, hourAngle(hour));
        const text = polarPoint(cx, cy, radius + 14, hourAngle(hour));
        const labelled = major && (nowHour === undefined || Math.round(nowHour) % 24 !== hour);
        return (
          <g key={hour} data-slot="time-ring-hour">
            <line {...tick} strokeWidth={major ? 1.5 : 1} className="stroke-[color-mix(in_oklab,var(--base-foreground)_60%,transparent)]" />
            {labelled ? (
              <text x={text.x} y={text.y} textAnchor="middle" dominantBaseline="central" fontSize={12} className="fill-muted-foreground tabular-nums">
                {pad(hour)}
              </text>
            ) : null}
          </g>
        );
      })}
      {events.map((event) => {
        const at = polarPoint(cx, cy, radius - 13, hourAngle(event.hour));
        return (
          <path
            key={event.id}
            data-slot="time-ring-event"
            data-kind={event.kind}
            role="img"
            aria-label={event.label}
            transform={`translate(${at.x} ${at.y})`}
            d={eventPath(event.kind, 5)}
            strokeWidth={1.5}
            strokeLinejoin="round"
            className={EVENT_CLASS[event.kind]}
          >
            <title>{event.label}</title>
          </path>
        );
      })}
      {now ? (
        <text data-slot="time-ring-now" x={now.x} y={now.y} textAnchor="middle" dominantBaseline="central" fontSize={11} className="fill-base-foreground font-semibold uppercase">
          Now
        </text>
      ) : null}
      {cursor && cursorKnob ? (
        <g data-slot="time-ring-cursor" className="[filter:drop-shadow(0_0_6px_color-mix(in_oklab,var(--primary-background)_80%,transparent))]">
          <line {...cursor} strokeWidth={2.5} strokeLinecap="round" className="stroke-[color:var(--primary-background)]" />
          <circle cx={cursorKnob.x} cy={cursorKnob.y} r={5} strokeWidth={2} className="fill-card-background stroke-[color:var(--primary-background)]" />
        </g>
      ) : null}
    </g>
  );
}
