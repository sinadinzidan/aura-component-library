import { Button } from '@cognite/aura/components/button';
import type { ReactNode } from 'react';

import { FilterChip } from './FilterChip';

export type FilterBarChip = {
  id: string;
  /** The filtered property: "Site". */
  label: string;
  /** The applied value, already formatted. */
  value: string;
};

type FilterBarProps = {
  /** Accessible name of the whole bar: "Filter work orders". */
  label: string;
  /** The controls, most used first: search, then filters. */
  children: ReactNode;
  /** Controls pushed to the far end of the first row, such as a view switch or column menu. */
  end?: ReactNode;
  /** Applied filters. The chip row appears only while there is at least one. */
  chips?: readonly FilterBarChip[];
  onRemoveChip?: (id: string) => void;
  /** Adds a "Clear all" button after the chips. */
  onClearAll?: () => void;
  clearAllLabel?: string;
  /** Result count for the chip row, such as "12 of 248 work orders". Announced when it changes. */
  summary?: ReactNode;
};

/**
 * The bar above a list or table: controls on the first row and, while filters are applied, a
 * second row of removable chips with "Clear all". The result count sits at the end of the chip row,
 * or at its start while nothing is applied. The second row takes no
 * space until it has something to show.
 */
export function FilterBar({
  label,
  children,
  end,
  chips = [],
  onRemoveChip,
  onClearAll,
  clearAllLabel = 'Clear all',
  summary,
}: FilterBarProps) {
  const hasChips = chips.length > 0;

  return (
    <div role="search" aria-label={label} className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {children}
        {end ? <div className="ml-auto flex items-center gap-2">{end}</div> : null}
      </div>
      {hasChips || summary ? (
        <div className="flex items-start justify-between gap-4">
          {hasChips ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ul aria-label="Applied filters" className="contents list-none">
                {chips.map((chip) => (
                  <li key={chip.id} className="flex min-w-0">
                    <FilterChip label={chip.label} value={chip.value} onRemove={() => onRemoveChip?.(chip.id)} />
                  </li>
                ))}
              </ul>
              {onClearAll ? (
                <Button variant="ghost" size="sm" onClick={onClearAll}>
                  {clearAllLabel}
                </Button>
              ) : null}
            </div>
          ) : null}
          {summary ? (
            <output
              aria-live="polite"
              className="flex min-h-7 shrink-0 items-center text-sm tabular-nums text-muted-foreground"
            >
              {summary}
            </output>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
