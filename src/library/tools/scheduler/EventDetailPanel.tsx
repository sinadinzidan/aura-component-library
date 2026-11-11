import { Button } from '@cognite/aura/components/button';
import { IconAlertTriangle, IconTrash, IconX } from '@cognite/aura/icons';

import { IconAction } from '../../patterns/collections/IconAction';

import type { Conflict, SchedEvent } from './conflicts';
import { formatDuration, formatSpan, longDayLabel } from './timeMath';

export type EventDetailPanelProps = {
  event: SchedEvent;
  crewName: string;
  conflicts: readonly Conflict[];
  /** Hidden for a read-only calendar. */
  onDelete?: () => void;
  onClose: () => void;
};

const KIND_LABEL: Record<SchedEvent['kind'], string> = { job: 'Maintenance job', permit: 'Permit', meeting: 'Meeting' };

/**
 * The panel beside the calendar for one item: what it is, when, who does it, and every reason it
 * conflicts, with the actions that apply. Delete can be undone from the calendar.
 */
export function EventDetailPanel({ event, crewName, conflicts, onDelete, onClose }: EventDetailPanelProps) {
  const rows: readonly { label: string; value: string; mono?: boolean }[] = [
    { label: 'Day', value: longDayLabel(event.dayId) },
    { label: 'Time', value: event.allDay ? 'All day' : `${formatSpan(event.start, event.end)} (${formatDuration(event.end - event.start)})` },
    { label: 'Crew', value: crewName },
    ...(event.reference ? [{ label: event.kind === 'permit' ? 'Permit' : 'Asset', value: event.reference, mono: true }] : []),
  ];

  return (
    <section aria-label={`Details of ${event.title}`} data-slot="event-detail" className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4 overflow-auto p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{KIND_LABEL[event.kind]}</p>
          <h3 className="text-base font-semibold text-base-foreground">{event.title}</h3>
        </div>
        <IconAction label="Close details" onClick={onClose}>
          <IconX />
        </IconAction>
      </header>
      <dl className="flex flex-col gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className={`min-w-0 text-right text-base-foreground ${row.mono ? 'font-mono text-xs' : ''}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      {conflicts.length > 0 ? (
        <div role="group" aria-label="Conflicts" className="flex flex-col gap-2 rounded-lg bg-warning-background px-3 py-2 text-warning-foreground">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <IconAlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
            {conflicts.length === 1 ? 'Conflict' : `${conflicts.length} conflicts`}
          </p>
          <ul className="flex flex-col gap-1 text-xs">
            {conflicts.map((conflict) => (
              <li key={conflict.message}>{conflict.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {onDelete ? (
        <div className="mt-auto">
          <Button variant="secondary" onClick={onDelete}>
            <IconTrash /> Delete job
          </Button>
        </div>
      ) : null}
    </section>
  );
}
