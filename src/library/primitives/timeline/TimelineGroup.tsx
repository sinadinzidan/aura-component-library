import { useId } from 'react';
import type { ReactNode } from 'react';

export type TimelineGroupProps = {
  /** What the events share: a day, a shift, an hour. */
  heading: ReactNode;
  /** Quiet text after the heading, such as how many events the group holds. */
  meta?: ReactNode;
  /** The group's `TimelineItem`s. */
  children: ReactNode;
};

/**
 * A run of events under one heading, such as a day. The line stops at the end of each group, so
 * the break between days is visible, and the heading names the group's list for screen readers.
 */
export function TimelineGroup({ heading, meta, children }: TimelineGroupProps) {
  const headingId = useId();

  return (
    <li data-slot="timeline-group" className="flex min-w-0 flex-col pt-5 first:pt-0">
      <div className="flex items-baseline gap-2 pb-2 text-xs leading-5">
        <span id={headingId} className="font-medium text-medium-foreground">
          {heading}
        </span>
        {meta ? <span className="text-muted-foreground tabular-nums">{meta}</span> : null}
      </div>
      <ol aria-labelledby={headingId} className="flex min-w-0 list-none flex-col">
        {children}
      </ol>
    </li>
  );
}
