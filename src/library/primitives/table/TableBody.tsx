import type { ReactNode } from 'react';

import { TableSectionContext } from './tableContext';

export type TableBodyProps = {
  /** `TableRow`s, and where needed `TableSectionRow`, `TableDetailRow` or `TableMessageRow`. */
  children: ReactNode;
};

/** The `tbody` of a `Table`. The last row drops its divider so the table ends cleanly. */
export function TableBody({ children }: TableBodyProps) {
  return (
    <TableSectionContext.Provider value="body">
      <tbody data-slot="table-body">{children}</tbody>
    </TableSectionContext.Provider>
  );
}
