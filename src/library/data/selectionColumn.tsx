import type { ColumnDef } from '@tanstack/react-table';

import { SelectionCheckbox } from './SelectionCheckbox';

type SelectionColumnOptions<TData> = {
  /** Names a row for assistive technology, for example its ID or title. */
  getRowLabel?: (row: TData) => string;
  /** Accessible name of the header checkbox. */
  selectAllLabel?: string;
};

/**
 * The leading checkbox column for a DataGrid with `enableRowSelection`. Aura's grid tracks the
 * selection and shows the action toolbar, but leaves the checkboxes to the column definitions:
 * put this first in `columns`. The header checkbox selects the current page and shows a dash
 * when only some rows are selected.
 */
export function selectionColumn<TData>({
  getRowLabel,
  selectAllLabel = 'Select all rows',
}: SelectionColumnOptions<TData> = {}): ColumnDef<TData> {
  return {
    id: 'select',
    size: 44,
    enableSorting: false,
    enableResizing: false,
    header: ({ table }) => {
      const all = table.getIsAllPageRowsSelected();
      return (
        <SelectionCheckbox
          label={selectAllLabel}
          checked={all}
          indeterminate={!all && table.getIsSomePageRowsSelected()}
          onChange={(next) => table.toggleAllPageRowsSelected(next)}
        />
      );
    },
    cell: ({ row }) => {
      const selected = row.getIsSelected();
      return (
        <SelectionCheckbox
          label={getRowLabel ? `Select ${getRowLabel(row.original)}` : 'Select row'}
          checked={selected}
          indeterminate={!selected && row.getIsSomeSelected()}
          disabled={!row.getCanSelect()}
          onChange={(next) => row.toggleSelected(next)}
        />
      );
    },
  };
}
