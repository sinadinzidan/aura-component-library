import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Search } from '@cognite/aura/components/search';
import { IconX } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type TableToolbarChip = { id: string; label: string };

type TableToolbarProps = {
  /** Accessible name of the search field, for example "Search work orders". */
  searchLabel: string;
  searchPlaceholder?: string;
  query: string;
  onQueryChange: (query: string) => void;
  /** Filter controls that sit right after the search field. */
  filters?: ReactNode;
  /** Result count, such as "6 of 8 work orders". Announced when it changes. */
  summary?: ReactNode;
  /** Page actions at the end, such as "Export" or "Create work order". */
  actions?: ReactNode;
  /** Applied filters, shown as removable chips on a second line. */
  chips?: readonly TableToolbarChip[];
  onRemoveChip?: (id: string) => void;
  onClearChips?: () => void;
};

/**
 * The row above a table: search first, filters next to it, the result count and page actions at
 * the far end, and the applied filters as removable chips underneath. Controlled, so the same
 * query can drive a plain table, a DataGrid or a list.
 */
export function TableToolbar({
  searchLabel,
  searchPlaceholder = 'Search',
  query,
  onQueryChange,
  filters,
  summary,
  actions,
  chips = [],
  onRemoveChip,
  onClearChips,
}: TableToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-wrap items-center gap-3">
        <Search
          aria-label={searchLabel}
          placeholder={searchPlaceholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onClear={() => onQueryChange('')}
          className="w-64 max-w-full"
        />
        {filters}
        <div className="ml-auto flex items-center gap-3">
          {summary ? (
            <span role="status" className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
              {summary}
            </span>
          ) : null}
          {actions}
        </div>
      </div>
      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2" aria-label="Applied filters" role="group">
          {chips.map((chip) => (
            <Badge
              key={chip.id}
              variant="closable"
              render={<button type="button" aria-label={`Remove filter ${chip.label}`} />}
              onClick={() => onRemoveChip?.(chip.id)}
            >
              {chip.label} <IconX aria-hidden="true" />
            </Badge>
          ))}
          {onClearChips ? (
            <Button variant="ghost" size="sm" onClick={onClearChips}>
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
