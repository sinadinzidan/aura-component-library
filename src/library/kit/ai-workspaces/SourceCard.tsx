import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type SourceCardProps = {
  /** The citation number used in the answer. */
  index: number;
  title: string;
  /** What kind of source it is: "Time series", "P&ID", "Work order". */
  kind: string;
  /** Where in the source the answer came from: a page, a time range, a tag. */
  location?: string;
  /** The passage or reading that was used. */
  excerpt?: ReactNode;
  /** The source the reader has in focus. */
  active?: boolean;
  className?: string;
};

/**
 * One cited source beside an answer: its number, what it is, where in it the answer came from
 * and the passage itself. The active source takes the accent; rules and corners follow the look.
 */
export function SourceCard({ index, title, kind, location, excerpt, active = false, className }: SourceCardProps) {
  const look = useLook();
  return (
    <article
      data-look={look}
      data-active={active ? '' : undefined}
      className={cx(
        'flex min-w-0 gap-3 rounded-(--kit-radius-sm) border border-(--kit-rule) bg-(--kit-surface) p-3.5',
        'data-active:border-(--kit-line-accent) data-active:bg-[color-mix(in_oklab,var(--kit-line-accent)_9%,var(--kit-surface))]',
        className,
      )}
    >
      <span
        className={cx(
          'flex size-7 shrink-0 items-center justify-center rounded-(--kit-track-radius) text-sm font-semibold tabular-nums',
          active ? 'bg-(--kit-accent) text-(color:--kit-on-accent)' : 'border border-(--kit-rule-strong) text-(color:--kit-text)',
        )}
      >
        <span className="sr-only">Source </span>
        {index}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h4 className="text-sm font-semibold text-(color:--kit-text)">{title}</h4>
        <p className="text-xs text-(color:--kit-text-3)">
          {kind}
          {location ? ` · ${location}` : ''}
        </p>
        {excerpt ? <div className="mt-1 border-l-2 border-(--kit-rule-strong) pl-3 text-sm text-(color:--kit-text-2)">{excerpt}</div> : null}
      </div>
    </article>
  );
}
