import { Children, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { TIMELINE_ROW, TIMELINE_TIME_COLUMN, TimelineContext } from './timelineContext';

export type TimelineCollapseProps = {
  /** The items to fold away, usually the middle of a long timeline. */
  children: ReactNode;
  /** How many events are hidden. Defaults to the number of children. */
  count?: number;
  /** Button text while folded. Defaults to "Show 8 earlier". */
  showLabel?: (count: number) => string;
  /** Button text while open. Defaults to "Hide 8 earlier". */
  hideLabel?: (count: number) => string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

/**
 * Folds the middle of a long vertical timeline behind one button, so the first and the latest
 * events stay on screen. The line turns dotted where events are hidden; the button says how many
 * and opens them in place.
 */
export function TimelineCollapse({
  children,
  count,
  showLabel = (hidden) => `Show ${hidden} earlier`,
  hideLabel = (hidden) => `Hide ${hidden} earlier`,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
}: TimelineCollapseProps) {
  const { layout, density } = useContext(TimelineContext);
  const [internal, setInternal] = useState(defaultExpanded);
  const open = expanded ?? internal;
  const hidden = count ?? Children.count(children);
  const row = TIMELINE_ROW[density];

  const toggle = () => {
    setInternal(!open);
    onExpandedChange?.(!open);
  };

  return (
    <>
      <li data-slot="timeline-collapse" className={cn('flex min-w-0 gap-3', layout === 'alternate' && 'justify-center')}>
        {layout === 'time-start' ? <div className={TIMELINE_TIME_COLUMN} /> : null}
        {layout === 'alternate' ? null : (
          <div className="flex w-6 shrink-0 flex-col items-center">
            <span aria-hidden="true" className={cn('w-0 flex-1 border-l border-emphasized', !open && 'border-dotted')} />
          </div>
        )}
        <div className={cn('flex min-w-0', row.gap)}>
          <button
            type="button"
            aria-expanded={open}
            onClick={toggle}
            className="-mx-1.5 cursor-pointer rounded-md px-1.5 text-xs leading-6 font-medium text-muted-foreground tabular-nums outline-none transition-colors hover:bg-accent-background hover:text-base-foreground focus-visible:shadow-focus-ring"
          >
            {open ? hideLabel(hidden) : showLabel(hidden)}
          </button>
        </div>
      </li>
      {open ? children : null}
    </>
  );
}
