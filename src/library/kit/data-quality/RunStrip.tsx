import type { CSSProperties } from 'react';

import { useLook } from '../../looks/useLook';
import { markGap, markRadius, markStyle } from '../distributions/marks';
import { cx, toneLine } from '../tones';

import { RUN_LABEL, RUN_TONE, formatDuration, type Run } from './quality';

type RunStripProps = {
  /** Which pipeline and period, in words. */
  label: string;
  /** Oldest first. */
  runs: readonly Run[];
  /** `bars` scales each run by its duration; `blocks` draws equal cells for a dense row. */
  variant?: 'bars' | 'blocks';
  /** Height in px. */
  height?: number;
  /** Id of the selected run. */
  selected?: string;
  /** Makes each run a button. */
  onSelect?: (id: string) => void;
  /** Words for the start of a run, used in its accessible name: "12 Mar 13:30". */
  formatStart?: (timestamp: number) => string;
  className?: string;
};

/**
 * The recent runs of a pipeline, oldest to newest: colour says how each ended and, as bars, height
 * says how long it took. A failed run keeps a minimum height so it is never lost.
 */
export function RunStrip({ label, runs, variant = 'bars', height = 72, selected, onSelect, formatStart = (timestamp) => new Date(timestamp).toISOString(), className }: RunStripProps) {
  const look = useLook();
  const longest = Math.max(...runs.map((run) => run.durationMs), 1);
  const radius = markRadius(look, variant === 'blocks' ? 6 : 4);

  return (
    <div role={onSelect ? 'group' : 'img'} aria-label={label} data-look={look} className={cx('flex min-w-0 items-end', className)} style={{ height, gap: Math.max(markGap(look), 2) }}>
      {runs.map((run) => {
        const share = variant === 'blocks' ? 1 : Math.max(0.18, run.durationMs / longest);
        const picked = selected === run.id;
        const color = toneLine(RUN_TONE[run.status]);
        const style: CSSProperties = {
          ...(run.status === 'skipped' ? { border: `1.5px dashed ${color}` } : markStyle(look, color)),
          height: `${Math.round(share * 100)}%`,
          borderRadius: variant === 'blocks' ? radius : `${radius}px ${radius}px 0 0`,
          opacity: run.status === 'running' ? 0.6 : 1,
        };
        const name = `${formatStart(run.startedAt)}: ${RUN_LABEL[run.status].toLowerCase()}${run.durationMs > 0 ? `, ${formatDuration(run.durationMs)}` : ''}`;
        const classes = cx('min-w-0 flex-1', picked ? 'relative z-10 outline outline-2 outline-offset-2 outline-[var(--kit-text)]' : '');
        return onSelect ? (
          <button
            key={run.id}
            type="button"
            aria-label={name}
            aria-pressed={picked}
            data-run={run.status}
            className={cx(classes, 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--kit-text)]')}
            style={style}
            onClick={() => onSelect(run.id)}
          />
        ) : (
          <span key={run.id} title={name} data-run={run.status} className={classes} style={style} />
        );
      })}
    </div>
  );
}
