import type { ReactNode } from 'react';

export type TableDetailRowProps = {
  /** Number of columns in the table, so the detail spans all of them. */
  colSpan: number;
  /** Matches `controls` on the row's `TableExpandCell`. */
  id?: string;
  children: ReactNode;
};

/** The content under an expanded row: one cell across the table on a quiet surface. Render it only while the row is expanded. */
export function TableDetailRow({ colSpan, id, children }: TableDetailRowProps) {
  return (
    <tr data-slot="table-detail-row" id={id} className="group/row bg-muted-background">
      <td colSpan={colSpan} className="border-b border-default px-4 py-3 text-sm group-last/row:border-b-0">
        {children}
      </td>
    </tr>
  );
}
