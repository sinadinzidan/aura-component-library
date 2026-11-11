import { cn } from '../../../lib/utils';
import type { ReplayEvent } from '../../experiences/journeys/replayState';
import { StatusDot } from '../../industrial/StatusDot';
import type { DotShape, Tone } from '../../industrial/status';

export type ReplayEventLogProps = {
  events: readonly ReplayEvent[];
  /** Index of the latest event at or before the playhead; −1 before the first. */
  eventIndex: number;
  formatTime: (timestamp: number) => string;
  /** Called with an event's time when its row is clicked: move the playhead there. */
  onJump?: (t: number) => void;
  /** Accessible name of the list. */
  label?: string;
  className?: string;
};

const SHAPE: Record<Tone, DotShape> = { neutral: 'dot', success: 'dot', info: 'dot', warning: 'square', critical: 'diamond' };

/**
 * The event log of a replay as a list: events already passed in normal text, the current one
 * highlighted with its detail, events still ahead dimmed and marked "not yet". Each row is a
 * button that moves the playhead to that event.
 */
export function ReplayEventLog({ events, eventIndex, formatTime, onJump, label = 'Event log', className }: ReplayEventLogProps) {
  return (
    <ol aria-label={label} data-slot="replay-event-log" className={cn('flex flex-col', className)}>
      {events.map((event, index) => {
        const current = index === eventIndex;
        const reached = index <= eventIndex;
        const row = cn(
          'flex w-full items-start gap-2 rounded-md border-l-2 px-2 py-1.5 text-left',
          current ? 'border-[var(--primary-background)] bg-muted-background' : 'border-transparent'
        );
        const body = (
          <>
            <span className={cn('w-10 shrink-0 font-mono text-xs leading-5 tabular-nums', reached ? 'text-medium-foreground' : 'text-muted-foreground')}>{formatTime(event.t)}</span>
            <span className="flex h-5 shrink-0 items-center">
              <StatusDot tone={reached ? event.tone : 'neutral'} shape={reached ? SHAPE[event.tone] : 'ring'} size="sm" />
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn('block text-sm', current ? 'font-semibold text-base-foreground' : reached ? 'text-base-foreground' : 'text-muted-foreground')}>
                {event.title}
                {reached ? '' : ' · not yet'}
              </span>
              {current && event.detail ? <span className="mt-0.5 block text-xs text-medium-foreground">{event.detail}</span> : null}
            </span>
          </>
        );
        return (
          <li key={event.id} aria-current={current ? 'step' : undefined}>
            {onJump ? (
              <button
                type="button"
                aria-label={`Go to ${formatTime(event.t)}, ${event.title}`}
                onClick={() => onJump(event.t)}
                className={cn(row, 'cursor-pointer hover:bg-muted-background focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ring-default)]')}
              >
                {body}
              </button>
            ) : (
              <div className={row}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
