import { useContext } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { TIMELINE_ROW, TIMELINE_TIME_COLUMN, TimelineContext } from './timelineContext';
import type { TimelineConnector, TimelineShape, TimelineState, TimelineTone } from './timelineContext';

export type TimelineItemProps = {
  /** What happened, in a few words. */
  title: ReactNode;
  /** When it happened or is planned, already formatted: "13:46". */
  time?: string;
  /** How long it took or lasted, already formatted: "12 min". */
  duration?: string;
  /** One or two quiet lines under the title. */
  description?: ReactNode;
  /** Trailing content on the title row: a badge or a small action. */
  meta?: ReactNode;
  /** Richer content under the title: a card, a comment, a list of changes. */
  children?: ReactNode;
  /** An icon for the type of event, drawn in a round tile. */
  icon?: ReactNode;
  /** An avatar as the marker, for who did it. Use the smallest avatar size. */
  avatar?: ReactNode;
  /** Shape of the plain marker. Pair a shape with a tone so a state reads without colour. */
  shape?: TimelineShape;
  /** Colours the marker for an event that is itself a judged state change. Neutral otherwise. */
  tone?: TimelineTone;
  /** `done` happened, `current` is where things stand, `pending` has not happened yet. */
  state?: TimelineState;
  /** The line to the next item. Defaults to dashed after a pending item and solid otherwise. */
  connector?: TimelineConnector;
};

const SOLID: Record<TimelineTone, string> = {
  neutral: 'bg-neutral-foreground-strong',
  info: 'bg-info-foreground-strong',
  success: 'bg-success-foreground-strong',
  warning: 'bg-warning-foreground-strong',
  critical: 'bg-critical-foreground-strong',
};

const OUTLINE: Record<TimelineTone, string> = {
  neutral: 'border-neutral-foreground-strong',
  info: 'border-info-foreground-strong',
  success: 'border-success-foreground-strong',
  warning: 'border-warning-foreground-strong',
  critical: 'border-critical-foreground-strong',
};

const TILE: Record<TimelineTone, string> = {
  neutral: 'bg-medium-background text-medium-foreground',
  info: 'bg-info-background text-info-foreground',
  success: 'bg-success-background text-success-foreground',
  warning: 'bg-warning-background text-warning-foreground',
  critical: 'bg-critical-background text-critical-foreground',
};

const STATE_TEXT: Record<TimelineState, string | null> = {
  done: null,
  current: 'Current',
  pending: 'Not yet',
};

function shapeClass(shape: TimelineShape, tone: TimelineTone): string {
  switch (shape) {
    case 'ring':
      return cn('rounded-full border-2', OUTLINE[tone]);
    case 'square':
      // No radius: a themed radius would round a small square into a dot and lose the shape cue.
      return cn('rounded-none', SOLID[tone]);
    case 'diamond':
      return cn('rotate-45 rounded-none', SOLID[tone]);
    case 'dot':
      return cn('rounded-full', SOLID[tone]);
  }
}

function TimelineMarker({
  icon,
  avatar,
  shape,
  tone,
  state,
}: {
  icon: ReactNode;
  avatar: ReactNode;
  shape: TimelineShape;
  tone: TimelineTone;
  state: TimelineState;
}) {
  if (avatar) {
    return (
      <span data-slot="timeline-marker" data-marker="avatar" className={cn('flex items-center', state === 'pending' && 'opacity-60')}>
        {avatar}
      </span>
    );
  }
  if (icon) {
    const surface =
      state === 'pending'
        ? 'border border-dashed border-emphasized text-muted-foreground'
        : state === 'current' && tone === 'neutral'
          ? 'bg-primary-background text-primary-foreground'
          : TILE[tone];
    return (
      <span
        aria-hidden="true"
        data-slot="timeline-marker"
        data-marker="icon"
        className={cn('flex size-6 items-center justify-center rounded-full [&>svg]:size-3.5', surface)}
      >
        {icon}
      </span>
    );
  }
  if (state === 'pending') {
    return (
      <span
        aria-hidden="true"
        data-slot="timeline-marker"
        data-marker="pending"
        className="size-2.5 rounded-full border-2 border-emphasized"
      />
    );
  }
  if (state === 'current' && tone === 'neutral') {
    return (
      <span
        aria-hidden="true"
        data-slot="timeline-marker"
        data-marker="current"
        className="flex size-3.5 items-center justify-center rounded-full border-2 border-primary-background"
      >
        <span className="size-1.5 rounded-full bg-primary-background" />
      </span>
    );
  }
  return <span aria-hidden="true" data-slot="timeline-marker" data-marker={shape} className={cn('size-2.5', shapeClass(shape, tone))} />;
}

/**
 * One event on a `Timeline`. The marker is a dot or shape, an icon tile or an avatar; the line to
 * the next item is dashed below anything that has not happened. "Current" and "not yet" are also
 * written out for screen readers, so they never depend on the marker alone.
 */
export function TimelineItem({
  title,
  time,
  duration,
  description,
  meta,
  children,
  icon,
  avatar,
  shape = 'dot',
  tone = 'neutral',
  state = 'done',
  connector,
}: TimelineItemProps) {
  const { orientation, layout, density } = useContext(TimelineContext);
  const row = TIMELINE_ROW[density];
  const pending = state === 'pending';
  const line = connector ?? (pending ? 'dashed' : 'solid');
  const stateText = STATE_TEXT[state];
  const marker = <TimelineMarker icon={icon} avatar={avatar} shape={shape} tone={tone} state={state} />;
  const titleClass = cn(
    'text-sm',
    row.leading,
    pending ? 'text-muted-foreground' : state === 'current' ? 'font-medium text-base-foreground' : 'text-base-foreground'
  );
  const titleNode = (
    <span data-slot="timeline-title" className={cn('min-w-0', titleClass)}>
      {title}
      {stateText ? <span className="sr-only"> ({stateText})</span> : null}
    </span>
  );
  const descriptionNode = description ? (
    <div data-slot="timeline-description" className="text-xs leading-5 text-muted-foreground">
      {description}
    </div>
  ) : null;
  const itemProps = {
    'data-slot': 'timeline-item',
    'data-state': state,
    'aria-current': state === 'current' ? ('true' as const) : undefined,
  };

  if (orientation === 'horizontal') {
    return (
      <li {...itemProps} className="group/tl-item flex min-w-0 flex-1 flex-col gap-2">
        <div className={cn('flex items-center', row.box)}>
          <span className="flex min-w-2.5 shrink-0 items-center justify-center">{marker}</span>
          {line === 'none' ? null : (
            <span
              aria-hidden="true"
              data-slot="timeline-connector"
              className={cn('mx-2 h-0 flex-1 border-t border-emphasized group-last/tl-item:hidden', line === 'dashed' && 'border-dashed')}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-col pr-4 group-last/tl-item:pr-0">
          {titleNode}
          {time || duration ? (
            <span data-slot="timeline-time" className="text-xs leading-5 text-muted-foreground tabular-nums">
              {[time, duration].filter(Boolean).join(' · ')}
            </span>
          ) : null}
          {descriptionNode}
          {children ? <div className="min-w-0 pt-2">{children}</div> : null}
        </div>
      </li>
    );
  }

  const inlineTime =
    time || duration ? (
      <span data-slot="timeline-time" className={cn('shrink-0 text-xs text-muted-foreground tabular-nums', row.leading)}>
        {[time, duration].filter(Boolean).join(' · ')}
      </span>
    ) : null;

  const rail = (
    <div data-slot="timeline-rail" className="flex w-6 shrink-0 flex-col items-center">
      <span className={cn('flex items-center justify-center', row.box)}>{marker}</span>
      {line === 'none' ? null : (
        <span
          aria-hidden="true"
          data-slot="timeline-connector"
          className={cn('w-0 flex-1 border-l border-emphasized group-last/tl-item:hidden', line === 'dashed' && 'border-dashed')}
        />
      )}
    </div>
  );

  if (layout === 'alternate') {
    return (
      <li {...itemProps} className="group/tl-item grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-3">
        <div
          className={cn(
            'flex min-w-0 flex-col group-odd/tl-item:items-end group-odd/tl-item:text-right group-even/tl-item:order-3',
            row.gap,
            'group-last/tl-item:pb-0'
          )}
        >
          {titleNode}
          {descriptionNode}
          {children ? <div className="w-full min-w-0 pt-2 text-left">{children}</div> : null}
        </div>
        <div className="order-2 flex">{rail}</div>
        <div className="min-w-0 group-odd/tl-item:order-3 group-even/tl-item:text-right">{inlineTime}</div>
      </li>
    );
  }

  return (
    <li {...itemProps} className="group/tl-item flex min-w-0 gap-3">
      {layout === 'time-start' ? (
        <div
          data-slot="timeline-time-column"
          className={cn('flex flex-col text-xs text-muted-foreground tabular-nums', TIMELINE_TIME_COLUMN)}
        >
          <span data-slot="timeline-time" className={row.leading}>
            {time}
          </span>
          {duration ? <span className="leading-4">{duration}</span> : null}
        </div>
      ) : null}
      {rail}
      <div className={cn('flex min-w-0 flex-1 flex-col', row.gap, 'group-last/tl-item:pb-0')}>
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col">{titleNode}</div>
          {meta ? <div className={cn('flex shrink-0 items-center gap-2', row.box)}>{meta}</div> : null}
          {layout === 'plain' ? inlineTime : null}
        </div>
        {descriptionNode}
        {children ? <div className="min-w-0 pt-2">{children}</div> : null}
      </div>
    </li>
  );
}
