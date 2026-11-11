import { CheckboxItemControl } from '@cognite/aura/components/checkbox';
import { useContext } from 'react';

import { cn } from '../../../lib/utils';

import { TABLE_CELL_DENSITY, TABLE_PINNED_CELL, TableContext, TableSectionContext } from './tableContext';

export type TableSelectionCellProps = {
  /** Accessible name: "Select all work orders" in the header, "Select WO-104482" in a row. */
  label: string;
  checked: boolean;
  /** Header only: some, but not all, rows are selected. */
  indeterminate?: boolean;
  /** For a row that cannot be selected, or a header with no rows. */
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * The checkbox cell of a selectable table. In `TableHeader` it is the select-all control with an
 * indeterminate state; in a body row it selects that row. It has no visible label, so `label`
 * is required.
 */
export function TableSelectionCell({ label, checked, indeterminate = false, disabled = false, onCheckedChange }: TableSelectionCellProps) {
  const { density, stickyHeader, pinFirstColumn } = useContext(TableContext);
  const section = useContext(TableSectionContext);
  const inHead = section === 'head';
  const Cell = inHead ? 'th' : 'td';

  return (
    <Cell
      data-slot="table-selection-cell"
      scope={inHead ? 'col' : undefined}
      className={cn(
        'w-px border-b border-default align-middle',
        !inHead && 'group-last/row:border-b-0',
        TABLE_CELL_DENSITY[density],
        'pr-0',
        inHead && stickyHeader && 'sticky top-0 z-20 bg-inherit',
        pinFirstColumn && cn(TABLE_PINNED_CELL, inHead && 'first:z-30')
      )}
    >
      {/* The control is inline; the flex wrapper keeps its size and lifts it above a row-wide click target. */}
      <span className="relative z-10 flex items-center">
        <CheckboxItemControl
          aria-label={label}
          checked={checked}
          indeterminate={indeterminate}
          disabled={disabled}
          onCheckedChange={(next) => onCheckedChange(next)}
        />
      </span>
    </Cell>
  );
}
