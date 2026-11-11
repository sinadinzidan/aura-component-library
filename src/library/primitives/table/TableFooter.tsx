import type { ReactNode } from 'react';

import { TableSectionContext } from './tableContext';

export type TableFooterProps = {
  /** A `TableRow` of totals or a summary. */
  children: ReactNode;
};

/** The `tfoot` of a `Table`: a summary row set apart by a stronger rule and medium weight. */
export function TableFooter({ children }: TableFooterProps) {
  return (
    <TableSectionContext.Provider value="foot">
      <tfoot data-slot="table-footer">{children}</tfoot>
    </TableSectionContext.Provider>
  );
}
