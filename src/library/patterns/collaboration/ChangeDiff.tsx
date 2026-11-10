import { IconArrowNarrowRight } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

type ChangeDiffProps = {
  /** The property that changed: "Priority", "High limit". */
  field: string;
  /** The old value. Leave out when the property was empty before. */
  before?: ReactNode;
  /** The new value. Leave out when the property was cleared. */
  after?: ReactNode;
  /** Monospace values, for tags, ids and limits. */
  mono?: boolean;
  /** `inline` keeps field and values on one line; `stacked` puts the field above them, for narrow panels. */
  layout?: 'inline' | 'stacked';
  /** Shown for a missing side. */
  emptyValue?: string;
};

function isMissing(value: ReactNode): boolean {
  return value === undefined || value === null || value === '';
}

/**
 * One changed property as "field: before → after". The old value is struck through and the new
 * one is stronger, the arrow gives the direction, and the sentence is spelled out for screen
 * readers, so the change never depends on red and green.
 */
export function ChangeDiff({ field, before, after, mono = false, layout = 'inline', emptyValue = 'None' }: ChangeDiffProps) {
  const value = mono ? 'font-mono text-xs' : '';
  const empty = <span className="text-muted-foreground">{emptyValue}</span>;

  return (
    <div
      data-slot="change-diff"
      className={`flex min-w-0 text-sm ${layout === 'stacked' ? 'flex-col gap-0.5' : 'flex-wrap items-baseline gap-x-3 gap-y-0.5'}`}
    >
      <span className={`text-muted-foreground ${layout === 'stacked' ? 'text-xs' : ''}`}>{field}</span>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
        <span className="sr-only">changed from</span>
        {isMissing(before) ? empty : <del className={`text-muted-foreground line-through ${value}`}>{before}</del>}
        <IconArrowNarrowRight aria-hidden="true" className="size-4 shrink-0 self-center text-muted-foreground" />
        <span className="sr-only">to</span>
        {isMissing(after) ? empty : <ins className={`font-medium text-base-foreground no-underline ${value}`}>{after}</ins>}
      </span>
    </div>
  );
}
