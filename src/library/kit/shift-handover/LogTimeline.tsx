import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';

import { useLook } from '../../looks/useLook';
import { TagId } from '../TagId';
import { cx, type Tone } from '../tones';

export type LogEntry = {
  id: string;
  /** Clock time of the entry: "13:46". */
  time: string;
  /** Section of the log: "Compression", "Safety". */
  section: string;
  headline: string;
  body: string;
  /** State of the matter at handover, as a word: "Open", "Closed", "Watch". */
  state: string;
  tone: Tone;
  /** Tags the entry is about. */
  tags?: readonly string[];
  /** Initials of who wrote it. */
  by?: string;
  /** The incoming shift must tick this entry before signing. */
  needsAck?: boolean;
};

type LogTimelineProps = {
  /** Accessible name: "Day shift log". */
  label: string;
  entries: readonly LogEntry[];
  /** Ids of entries the incoming shift has ticked. */
  acknowledged?: readonly string[];
  onAcknowledge?: (id: string, acknowledged: boolean) => void;
  /** Words next to the tick box. */
  ackLabel?: string;
  /** `compact` drops the body text and shrinks the type, for a phone or a side column. */
  density?: 'default' | 'compact';
  className?: string;
};

/**
 * A shift log set as a typographic timeline: the time in the margin, a rule with a state marker,
 * then section, headline and body like a short news item. Entries that must be read carry a tick
 * box; a ticked entry is marked as read but stays fully legible.
 */
export function LogTimeline({ label, entries, acknowledged = [], onAcknowledge, ackLabel = 'Read and understood', density = 'default', className }: LogTimelineProps) {
  const look = useLook();
  const compact = density === 'compact';

  return (
    <ol aria-label={label} data-look={look} className={cx('min-w-0 text-(--kit-text)', className)}>
      {entries.map((entry, index) => {
        const done = acknowledged.includes(entry.id);
        const last = index === entries.length - 1;
        return (
          <li key={entry.id} data-tone={entry.tone} className={cx('grid gap-x-4', compact ? 'grid-cols-[3.25rem_0.75rem_minmax(0,1fr)]' : 'grid-cols-[5.5rem_0.875rem_minmax(0,1fr)]')}>
            <div className="text-right">
              <time className={cx('block leading-none font-medium tracking-tight tabular-nums', compact ? 'text-lg' : 'text-3xl')}>{entry.time}</time>
              {entry.by && !compact ? <span className="mt-1.5 block text-xs text-(--kit-text-2)">by {entry.by}</span> : null}
            </div>
            <div aria-hidden="true" className="relative flex justify-center">
              {last ? null : <span className="absolute top-0 bottom-0 w-px bg-(--kit-rule-strong)" />}
              <span className={cx('relative mt-1 block bg-(--t-solid)', compact ? 'size-3' : 'size-3.5')} />
            </div>
            <article className={cx('min-w-0', last ? '' : compact ? 'pb-5' : 'pb-7')}>
              <p className="flex flex-wrap items-baseline gap-x-2 text-sm leading-5">
                <span className="font-medium text-(--kit-text-2)">{entry.section}</span>
                <span className="font-semibold text-(--t-ink)">{entry.state}</span>
                {done ? <span className="text-(--kit-text-2)">· acknowledged</span> : null}
              </p>
              <h4 className={cx('mt-1 font-medium tracking-tight text-balance', compact ? 'text-base leading-snug' : 'text-2xl leading-tight')}>{entry.headline}</h4>
              {compact ? null : <p className="mt-2 max-w-prose text-base leading-relaxed text-(--kit-text-2)">{entry.body}</p>}
              {entry.tags && entry.tags.length > 0 ? (
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                  {entry.tags.map((tag) => (
                    <TagId key={tag}>{tag}</TagId>
                  ))}
                </p>
              ) : null}
              {entry.needsAck ? (
                <div className="mt-3">
                  <CheckboxItem>
                    <CheckboxItemControl checked={done} onCheckedChange={(checked) => onAcknowledge?.(entry.id, checked === true)} />
                    <CheckboxItemLabel>
                      {ackLabel}
                      <span className="sr-only">: {entry.headline}</span>
                    </CheckboxItemLabel>
                  </CheckboxItem>
                </div>
              ) : null}
            </article>
          </li>
        );
      })}
    </ol>
  );
}
