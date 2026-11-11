import type { ReactNode } from 'react';

export type TableMessageRowProps = {
  /** Number of columns in the table. */
  colSpan: number;
  /** The message: a line of text, an empty state, or an error with a retry action. */
  children: ReactNode;
};

/**
 * One cell across the table for when there are no rows to show: empty, filtered to nothing, or
 * failed to load. The header stays, so the table keeps its shape.
 */
export function TableMessageRow({ colSpan, children }: TableMessageRowProps) {
  return (
    <tr data-slot="table-message-row">
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-3">{children}</div>
      </td>
    </tr>
  );
}
