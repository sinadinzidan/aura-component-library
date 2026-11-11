import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { cx } from '../tones';

import { APPROVAL_LABEL, APPROVAL_TONE, type Approval } from './documents';

export type Revision = {
  revision: string;
  /** Issue date, already formatted. */
  date: string;
  author: string;
  /** What changed. */
  note: string;
  approval: Approval;
};

type RevisionRailProps = {
  /** Which document, in words. */
  label: string;
  /** Newest first. */
  revisions: readonly Revision[];
  /** The selected revision. */
  selected?: string;
  /** Makes each revision a button. */
  onSelect?: (revision: string) => void;
  className?: string;
};

/**
 * The history of a document as a rail, newest on top: each revision with its letter, what
 * changed, who issued it and whether it is the one in force.
 */
export function RevisionRail({ label, revisions, selected, onSelect, className }: RevisionRailProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'editorial';

  return (
    <ol aria-label={label} data-look={look} className={cx('flex min-w-0 flex-col text-[var(--kit-text)]', className)}>
      {revisions.map((entry, index) => {
        const picked = selected === entry.revision;
        const current = index === 0;
        const body = (
          <>
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-sm font-semibold leading-5">Revision {entry.revision}</span>
              <StatusPill tone={APPROVAL_TONE[entry.approval]}>{APPROVAL_LABEL[entry.approval]}</StatusPill>
            </span>
            <span className="text-sm leading-5 text-[var(--kit-text)]">{entry.note}</span>
            <span className="text-xs leading-4 text-[var(--kit-text-2)]">
              {entry.author} · {entry.date}
            </span>
          </>
        );
        const classes = cx('flex min-w-0 flex-1 flex-col items-start gap-1 px-3 py-2 text-left', picked ? 'bg-[var(--kit-track)]' : '');
        return (
          <li key={entry.revision} data-revision={entry.revision} className="flex min-w-0 gap-3">
            <span className="flex w-9 shrink-0 flex-col items-center">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center text-sm font-semibold tabular-nums"
                style={{
                  borderRadius: square ? 0 : 999,
                  background: current ? 'var(--kit-accent)' : 'var(--kit-halo)',
                  color: current ? 'var(--kit-on-accent)' : 'var(--kit-text)',
                  border: `${look === 'poster' ? 2 : 1}px solid ${current ? 'var(--kit-accent)' : 'var(--kit-rule-strong)'}`,
                }}
              >
                {entry.revision}
              </span>
              {index < revisions.length - 1 ? <span className="w-px flex-1 bg-[var(--kit-rule-strong)]" /> : null}
            </span>
            <div className="min-w-0 flex-1 pb-4">
              {onSelect ? (
                <button
                  type="button"
                  aria-pressed={picked}
                  className={cx(classes, 'w-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--kit-text)]')}
                  style={{ borderRadius: 'var(--kit-radius-sm)' }}
                  onClick={() => onSelect(entry.revision)}
                >
                  {body}
                </button>
              ) : (
                <div className={classes}>{body}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
