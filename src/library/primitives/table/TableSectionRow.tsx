import { useContext } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { TABLE_CELL_DENSITY, TableContext } from './tableContext';

export type TableSectionRowProps = {
  /** Number of columns in the table. */
  colSpan: number;
  /** The group's name: "Gas compression". */
  children: ReactNode;
  /** How many rows the group holds, shown after the name. */
  count?: number;
};

/** A heading row that starts a group of rows, such as an area or a day. It names the rows under it for assistive technology. */
export function TableSectionRow({ colSpan, children, count }: TableSectionRowProps) {
  const { density } = useContext(TableContext);

  return (
    <tr data-slot="table-section-row" className="bg-muted-background">
      <th
        scope="colgroup"
        colSpan={colSpan}
        className={cn(
          'border-b border-default text-left text-xs font-medium text-medium-foreground',
          TABLE_CELL_DENSITY[density],
          'h-7 py-1'
        )}
      >
        {children}
        {count !== undefined ? <span className="pl-2 font-normal text-muted-foreground tabular-nums">{count}</span> : null}
      </th>
    </tr>
  );
}
