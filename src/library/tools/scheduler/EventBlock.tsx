import { IconAlertTriangle } from '@cognite/aura/icons';
import type { CSSProperties, KeyboardEvent } from 'react';

import { cn } from '../../../lib/utils';

import type { SchedEvent } from './conflicts';
import { formatSpan } from './timeMath';

/** Crew colours: decorative, only to tell crews apart. Meetings and permits stay neutral. */
export const CREW_TONES: readonly string[] = [
  'bg-decorative-2-background text-decorative-2-foreground',
  'bg-decorative-3-background text-decorative-3-foreground',
  'bg-decorative-5-background text-decorative-5-foreground',
  'bg-decorative-6-background text-decorative-6-foreground',
];

export type EventBlockProps = {
  event: SchedEvent;
  /** Colour classes from `CREW_TONES`. */
  tone: string;
  /** Name of the crew, part of the accessible name. */
  crewName?: string;
  selected?: boolean;
  /** Reasons the item conflicts, joined for the name and the tooltip; none when it is fine. */
  conflict?: string | null;
  /** Position inside the column, as CSS percentages. */
  style?: CSSProperties;
  /** Drawn as the drop preview: not focusable, not clickable. */
  ghost?: boolean;
  /** Dimmed while it is being dragged. */
  dragging?: boolean;
  /** Draw a resize handle on the bottom edge. */
  resizable?: boolean;
  /** Lay out in the flow, for the all-day row, instead of positioned inside a column. */
  inline?: boolean;
  onActivate?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  /** Lines of text that fit: 1 shows the title only. */
  lines?: number;
};

/**
 * One calendar item as a block: title, time and reference, a warning with the word "Conflict" when
 * it clashes, and a handle on the bottom edge. It is a button so it can be focused and opened from
 * the keyboard; dragging is handled by the calendar through the `data-sched-*` attributes.
 */
export function EventBlock({ event, tone, crewName, selected = false, conflict = null, style, ghost = false, dragging = false, resizable = true, inline = false, onActivate, onKeyDown, lines = 3 }: EventBlockProps) {
  const time = event.allDay ? 'All day' : formatSpan(event.start, event.end);
  const name = [event.title, time, event.reference, crewName, event.kind === 'permit' ? 'permit' : null, conflict ? `conflict: ${conflict}` : null].filter(Boolean).join(', ');
  const surface = event.kind === 'job' ? tone : event.kind === 'permit' ? 'border border-dashed border-emphasized bg-base-background text-base-foreground' : 'bg-medium-background text-base-foreground';

  return (
    <button
      type="button"
      data-sched-event={ghost ? undefined : event.id}
      data-conflict={conflict ? 'true' : undefined}
      aria-label={ghost ? undefined : name}
      aria-hidden={ghost || undefined}
      aria-pressed={ghost ? undefined : selected}
      tabIndex={ghost ? -1 : 0}
      title={conflict ?? undefined}
      onClick={onActivate}
      onKeyDown={onKeyDown}
      style={style}
      className={cn(
        inline ? 'relative w-full' : 'absolute',
        'flex min-w-0 select-none flex-col overflow-hidden rounded-md px-2 py-0.5 text-left outline-none',
        surface,
        conflict ? 'ring-2 ring-inset ring-warning-foreground-strong' : '',
        selected ? 'shadow-focus-ring' : '',
        ghost ? 'pointer-events-none opacity-70 shadow-focus-ring' : 'cursor-grab focus-visible:shadow-focus-ring',
        dragging ? 'opacity-40' : ''
      )}
    >
      <span className="flex min-w-0 items-start gap-1">
        {conflict ? <IconAlertTriangle aria-hidden="true" className="mt-px size-3.5 shrink-0 text-warning-foreground-strong" /> : null}
        <span className="min-w-0 truncate text-xs font-medium leading-4">{event.title}</span>
      </span>
      {lines >= 2 ? <span className="shrink-0 truncate text-xs leading-4 tabular-nums opacity-80">{time}</span> : null}
      {lines >= 3 && event.reference ? <span className="shrink-0 truncate font-mono text-xs leading-4 opacity-80">{event.reference}</span> : null}
      {lines >= 4 && conflict ? <span className="shrink-0 truncate text-xs font-medium leading-4 text-warning-foreground-strong">Conflict</span> : null}
      {resizable && !ghost && !event.allDay ? <span aria-hidden="true" data-sched-resize={event.id} className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize" /> : null}
    </button>
  );
}
