import {
  DataGridHeader,
  DataGridHeaderEnd,
  DataGridHeaderStart,
  DataGridResultCount,
  DataGridSearch,
  DataGridSubtitle,
  DataGridTitle,
} from '@cognite/aura/data-grid';
import type { ReactNode } from 'react';

type DataTableToolbarProps = {
  title: string;
  /** What one row is, singular and plural, for the count: `['work order', 'work orders']`. */
  noun: readonly [singular: string, plural: string];
  /** Accessible name of the search field. Leave out to hide search. */
  searchLabel?: string;
  searchPlaceholder?: string;
  /** Buttons for the end of the toolbar, such as "Create" or "Export". */
  actions?: ReactNode;
};

/**
 * The header of a DataGrid: title, a live row count that follows search and filters, a search
 * field wired to the grid, and a slot for actions. Render it as a child of `DataGrid`.
 */
export function DataTableToolbar({ title, noun, searchLabel, searchPlaceholder = 'Search', actions }: DataTableToolbarProps) {
  const [singular, plural] = noun;

  return (
    <DataGridHeader>
      <DataGridHeaderStart>
        <DataGridTitle>{title}</DataGridTitle>
        <DataGridSubtitle>
          <DataGridResultCount
            formatLabel={(filtered, total) => {
              const word = (total ?? filtered) === 1 ? singular : plural;
              return total === undefined || total === filtered
                ? `${filtered.toLocaleString('en-GB')} ${word}`
                : `${filtered.toLocaleString('en-GB')} of ${total.toLocaleString('en-GB')} ${word}`;
            }}
          />
        </DataGridSubtitle>
      </DataGridHeaderStart>
      <DataGridHeaderEnd>
        {searchLabel ? <DataGridSearch aria-label={searchLabel} placeholder={searchPlaceholder} className="w-56" /> : null}
        {actions}
      </DataGridHeaderEnd>
    </DataGridHeader>
  );
}
