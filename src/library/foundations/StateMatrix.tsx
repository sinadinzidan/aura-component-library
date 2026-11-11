import type { ReactNode } from 'react';

import { Table } from '../primitives/table/Table';
import type { TableProps } from '../primitives/table/Table';
import { TableBody } from '../primitives/table/TableBody';
import { TableCaption } from '../primitives/table/TableCaption';
import { TableCell } from '../primitives/table/TableCell';
import { TableHead } from '../primitives/table/TableHead';
import { TableHeader } from '../primitives/table/TableHeader';
import { TableRow } from '../primitives/table/TableRow';

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
  /** The surface the matrix sits on, so its rows match it. */
  surface?: TableProps['surface'];
};

/**
 * A grid of the same control in each interaction state: one row per control, one column per
 * state. A real table, so each example is announced with its control and state.
 */
export function StateMatrix({
  caption,
  rowHeader = 'Control',
  columns,
  rows,
  dense = false,
  surface = 'base',
}: StateMatrixProps) {
  return (
    <div data-slot="state-matrix" className="w-full min-w-0">
      {/* Rows do not highlight under the pointer: the cells demonstrate hover states of their own. */}
      <Table
        density={dense ? 'compact' : 'comfortable'}
        hover={false}
        surface={surface}
      >
        <TableCaption srOnly>{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="align-bottom">{rowHeader}</TableHead>
            {columns.map((column) => (
              <TableHead key={column.id} className="align-bottom">
                {column.label}
                {column.hint ? (
                  <span className="block font-normal">{column.hint}</span>
                ) : null}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell rowHeader wrap="nowrap">
                {row.label}
              </TableCell>
              {columns.map((column) => {
                const content = row.cells[column.id];
                return (
                  <TableCell key={column.id}>
                    {content === undefined || content === null ? (
                      <span className="text-muted-foreground">
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">Not applicable</span>
                      </span>
                    ) : (
                      content
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
