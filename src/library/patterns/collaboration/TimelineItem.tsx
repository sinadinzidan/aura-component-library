import { useContext } from 'react';
import type { ReactNode } from 'react';

import { TIMELINE_GRID, TimelineLayoutContext } from './timelineLayout';

export type TimelineState = 'done' | 'current' | 'pending';
export type TimelineTone = 'neutral' | 'success' | 'warning' | 'critical' | 'info';

type TimelineItemProps = {
  title: ReactNode;
  /** When it happened, or is planned, already formatted: "13:46". */
  time?: string;
  /** One or two quiet lines under the title. */
  description?: ReactNode;
  /** Richer content under the title: a card, a diff, a comment. */
  children?: ReactNode;
  /** An icon for the type of event, drawn in a round tile. A dot when left out. */
  marker?: ReactNode;
  /** `done` happened, `current` is where things stand, `pending` has not happened yet. */
  state?: TimelineState;
  /** Colours the marker for an event that is itself a judged state change. Neutral otherwise. */
  tone?: TimelineTone;
  /** A group heading above the item, such as a day. Give it to the first item of each group. */
  heading?: string;
};

const DOT: Record<TimelineTone, string> = {
  neutral: 'bg-neutral-foreground-strong',
  success: 'bg-success-foreground-strong',
  warning: 'bg-warning-foreground-strong',
  critical: 'bg-critical-foreground-strong',
  info: 'bg-info-foreground-strong',
};

const TILE: Record<TimelineTone, string> = {
  neutral: 'bg-muted-background text-medium-foreground',
  success: 'bg-success-background text-success-foreground',
  warning: 'bg-warning-background text-warning-foreground',
  critical: 'bg-critical-background text-critical-foreground',
  info: 'bg-info-background text-info-foreground',
};

const STATE_TEXT: Record<TimelineState, string | null> = { done: null, current: 'Current', pending: 'Not yet' };

function Marker({ marker, state, tone }: { marker: ReactNode; state: TimelineState; tone: TimelineTone }) {
  if (marker) {
    const surface =
      state === 'pending'
        ? 'border border-dashed border-emphasized text-muted-foreground'
        : state === 'current'
          ? 'bg-primary-background text-primary-foreground'
          : TILE[tone];
    return (
      <span aria-hidden="true" data-slot="timeline-marker" className={`flex size-6 items-center justify-center rounded-full [&>svg]:size-3.5 ${surface}`}>
        {marker}
      </span>
    );
  }
  if (state === 'pending') {
    return <span aria-hidden="true" data-slot="timeline-marker" className="size-2.5 rounded-full border-2 border-emphasized" />;
  }
  if (state === 'current') {
    return (
      <span aria-hidden="true" data-slot="timeline-marker" className="flex size-4 items-center justify-center rounded-full border-2 border-primary-background">
        <span className="size-1.5 rounded-full bg-primary-background" />
      </span>
    );
  }
  return <span aria-hidden="true" data-slot="timeline-marker" className={`size-2.5 rounded-full ${DOT[tone]}`} />;
}

/**
 * One event on a `Timeline`. The marker column holds a dot or an icon tile and the line to the
 * next item; the line is dashed below anything that has not happened. The state is also written
 * out for screen readers, so "current" and "not yet" never depend on the marker alone.
 */
export function TimelineItem({
  title,
  time,
  description,
  children,
  marker,
  state = 'done',
  tone = 'neutral',
  heading,
}: TimelineItemProps) {
  const layout = useContext(TimelineLayoutContext);
  const pending = state === 'pending';
  const stateText = STATE_TEXT[state];

  const timeText = time ? (
    <span data-slot="timeline-time" className="text-xs leading-6 tabular-nums text-muted-foreground">
      {time}
    </span>
  ) : null;

  const content = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        <span className={`min-w-0 flex-1 text-sm leading-6 ${pending ? 'text-muted-foreground' : state === 'current' ? 'font-medium text-base-foreground' : 'text-base-foreground'}`}>
          {title}
          {stateText ? <span className="sr-only"> ({stateText})</span> : null}
        </span>
        {layout === 'plain' && timeText ? <span className="shrink-0">{timeText}</span> : null}
      </div>
      {description ? <div className="text-xs leading-5 text-muted-foreground">{description}</div> : null}
      {children ? <div className="min-w-0 pt-2">{children}</div> : null}
    </>
  );

  return (
    <li
      data-slot="timeline-item"
      data-state={state}
      aria-current={state === 'current' ? 'step' : undefined}
      className="group/timeline flex min-w-0 flex-col"
    >
      {heading ? (
        <div data-slot="timeline-heading" className="pb-2 text-xs font-medium text-muted-foreground pt-1 group-first/timeline:pt-0">
          {heading}
        </div>
      ) : null}
      <div className={`grid min-w-0 gap-x-3 ${TIMELINE_GRID[layout]}`}>
        {layout === 'time-start' ? <div className="text-right">{timeText}</div> : null}
        {layout === 'alternate' ? (
          <div className="min-w-0 pb-6 group-odd/timeline:text-right group-even/timeline:order-3 group-last/timeline:pb-0">
            {content}
          </div>
        ) : null}
        <div className={`flex flex-col items-center ${layout === 'alternate' ? 'order-2' : ''}`}>
          <span className="flex h-6 items-center justify-center">
            <Marker marker={marker} state={state} tone={tone} />
          </span>
          <span
            aria-hidden="true"
            data-slot="timeline-connector"
            className={`w-0 flex-1 border-l border-emphasized group-last/timeline:hidden ${pending ? 'border-dashed' : ''}`}
          />
        </div>
        {layout === 'alternate' ? (
          <div className="min-w-0 group-odd/timeline:order-3 group-even/timeline:text-right">{timeText}</div>
        ) : (
          <div className="min-w-0 pb-5 group-last/timeline:pb-0">{content}</div>
        )}
      </div>
    </li>
  );
}
