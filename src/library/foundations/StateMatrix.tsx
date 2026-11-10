import type { ReactNode } from 'react';

export type StateMatrixColumn = {
  id: string;
  label: string;
  /** Quiet second line under the label, such as "Static look-alike". */
  hint?: string;
};

export type StateMatrixRow = {
  id: string;
  label: string;
  /** One cell per column id. A missing cell reads "Not applicable". */
  cells: Readonly<Record<string, ReactNode>>;
};

export type StateMatrixProps = {
  /** Accessible caption: what the matrix compares. */
  caption: string;
  /** Header of the first column. */
  rowHeader?: string;
  columns: readonly StateMatrixColumn[];
  rows: readonly StateMatrixRow[];
  /** Tighter cells for wide matrices. */
  dense?: boolean;
};

/**
 * A grid of the same control in each interaction state: one row per control, one column per
 * state. A real table, so each example is announced with its control and state.
 */
export function StateMatrix({ caption, rowHeader = 'Control', columns, rows, dense = false }: StateMatrixProps) {
  const cell = dense ? 'px-2 py-2' : 'px-3 py-3';

  return (
    <table data-slot="state-matrix" className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-b border-default">
          <th scope="col" className={`${cell} text-xs font-medium text-muted-foreground`}>
            {rowHeader}
          </th>
          {columns.map((column) => (
            <th key={column.id} scope="col" className={`${cell} align-bottom text-xs font-medium text-muted-foreground`}>
              {column.label}
              {column.hint ? <span className="block font-normal">{column.hint}</span> : null}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-default last:border-b-0">
            <th scope="row" className={`${cell} text-sm font-medium whitespace-nowrap text-base-foreground`}>
              {row.label}
            </th>
            {columns.map((column) => {
              const content = row.cells[column.id];
              return (
                <td key={column.id} className={`${cell} align-middle`}>
                  {content === undefined || content === null ? (
                    <span className="text-muted-foreground">
                      <span aria-hidden="true">—</span>
                      <span className="sr-only">Not applicable</span>
                    </span>
                  ) : (
                    content
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
