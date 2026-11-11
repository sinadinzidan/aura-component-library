import type { ReactNode } from 'react';

import { TableSectionContext } from './tableContext';

export type TableHeaderProps = {
  /** One `TableRow` of `TableHead` cells. */
  children: ReactNode;
};

/** The `thead` of a `Table`. Rows inside it never hover and their cells are column headers. */
export function TableHeader({ children }: TableHeaderProps) {
  return (
    <TableSectionContext.Provider value="head">
      <thead data-slot="table-header">{children}</thead>
    </TableSectionContext.Provider>
  );
}
