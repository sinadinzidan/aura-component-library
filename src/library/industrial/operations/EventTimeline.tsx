import { Fragment } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import type { DotShape, Tone } from '../status';
import { StatusDot } from '../StatusDot';

export type TimelineEvent = {
  id: string;
  /** Formatted time of the event: "13:46". Leave out for a step that has not happened. */
  time?: string;
  title: string;
  detail?: ReactNode;
  /** Neutral unless the event itself is a state change worth colouring. */
  tone?: Tone;
  shape?: DotShape;
  /** Heading the event falls under, such as an hour. Consecutive events share one heading. */
  group?: string;
  /** A step that has not happened yet: hollow marker and muted text. */
  pending?: boolean;
};

export type EventTimelineProps = {
  events: readonly TimelineEvent[];
  /** Accessible name of the list, for example "Alarm history". */
  label: string;
  /** `vertical` is a log, newest or oldest first as given; `horizontal` is a short life cycle. */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
};

/**
 * Events on a line: a vertical log with optional group headings (by hour, by shift), or a
 * horizontal life cycle such as raised → acknowledged → cleared. Markers are neutral dots unless
 * an event carries a tone; steps that have not happened are hollow.
 */
export function EventTimeline({ events, label, orientation = 'vertical', className }: EventTimelineProps) {
  if (orientation === 'horizontal') {
    return (
      <ol data-slot="event-timeline" data-orientation="horizontal" aria-label={label} className={cn('flex w-full min-w-0', className)}>
        {events.map((event, index) => (
          <li key={event.id} data-pending={event.pending ? 'true' : undefined} className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex h-2.5 items-center">
              <StatusDot tone={event.pending ? 'neutral' : (event.tone ?? 'neutral')} shape={event.pending ? 'ring' : (event.shape ?? 'dot')} />
              {index < events.length - 1 ? (
                <span aria-hidden="true" className={cn('mx-2 h-px flex-1', events[index + 1].pending ? 'border-t border-dashed border-emphasized' : 'bg-chart-neutral-300')} />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-0.5 pr-4">
              <span className={cn('truncate text-sm', event.pending ? 'text-muted-foreground' : 'font-medium text-base-foreground')}>{event.title}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{event.time ?? 'Pending'}</span>
              {event.detail ? <span className="text-xs text-muted-foreground">{event.detail}</span> : null}
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol data-slot="event-timeline" data-orientation="vertical" aria-label={label} className={cn('flex w-full min-w-0 flex-col', className)}>
      {events.map((event, index) => {
        const startsGroup = event.group !== undefined && event.group !== events[index - 1]?.group;
        const isLast = index === events.length - 1;
        return (
          <Fragment key={event.id}>
            {startsGroup ? (
              <li data-slot="timeline-group" className={cn('text-xs font-medium text-muted-foreground tabular-nums', index > 0 ? 'pb-2 pt-1' : 'pb-2')}>
                {event.group}
              </li>
            ) : null}
            <li data-pending={event.pending ? 'true' : undefined} className="grid grid-cols-[2.75rem_0.625rem_minmax(0,1fr)] gap-x-3">
              <span className="pt-px text-right text-xs leading-5 text-muted-foreground tabular-nums">{event.time ?? ''}</span>
              <span className="flex flex-col items-center">
                <span className="flex h-5 items-center">
                  <StatusDot tone={event.pending ? 'neutral' : (event.tone ?? 'neutral')} shape={event.pending ? 'ring' : (event.shape ?? 'dot')} />
                </span>
                {isLast ? null : <span aria-hidden="true" className="w-px flex-1 bg-chart-neutral-300" />}
              </span>
              <div className={cn('flex min-w-0 flex-col gap-0.5', isLast ? undefined : 'pb-4')}>
                <span className={cn('text-sm leading-5', event.pending ? 'text-muted-foreground' : 'text-base-foreground')}>{event.title}</span>
                {event.detail ? <span className="text-xs text-muted-foreground">{event.detail}</span> : null}
              </div>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
