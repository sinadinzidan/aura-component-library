import type { ReactNode } from 'react';

import type { LookId } from '../looks/looks';
import { useLook } from '../looks/useLook';
import { Table } from '../primitives/table/Table';
import { TableBody } from '../primitives/table/TableBody';
import { TableCell } from '../primitives/table/TableCell';
import { TableHead } from '../primitives/table/TableHead';
import { TableHeader } from '../primitives/table/TableHeader';
import { TableRow } from '../primitives/table/TableRow';

import { cx, type Tone } from './tones';

export type DataTableColumn<Row> = {
  id: string;
  header: string;
  cell: (row: Row) => ReactNode;
  /** Right-aligned tabular figures. */
  numeric?: boolean;
  align?: 'start' | 'center' | 'end';
  /** Quieter text for secondary columns. */
  muted?: boolean;
  /** Keep the cell on one line. */
  nowrap?: boolean;
  /** Layout class for the column width, such as `w-32`. */
  width?: string;
};

type Density = 'compact' | 'default' | 'comfortable';

const LOOK_DENSITY: Record<LookId, Density> = {
  studio: 'comfortable',
  console: 'compact',
  poster: 'comfortable',
  glass: 'comfortable',
  editorial: 'comfortable',
  soft: 'comfortable',
  blueprint: 'default',
  signal: 'comfortable',
};

type DataTableProps<Row> = {
  /** Accessible name, for example "Work orders". */
  label: string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  /** State of a row: an edge bar in most looks, a filled row in soft and signal. */
  rowTone?: (row: Row) => Tone | undefined;
  /** Leave out to let the look choose: compact in console, comfortable elsewhere. */
  density?: Density;
  /** Inside a `Panel padding="none"`: the first and last cells take the panel's padding. */
  flush?: boolean;
  className?: string;
};

/**
 * A static table on the table primitive, dressed by the look: header strip, zebra rows and a
 * thick status edge in console, ruled lines in editorial, pill rows in soft, full cell borders on
 * a blueprint. The first column names the row.
 */
export function DataTable<Row>({ label, columns, rows, rowKey, rowTone, density, flush = false, className }: DataTableProps<Row>) {
  const look = useLook();
  return (
    <div data-look={look} data-flush={flush} className={cx('kit-table', className)}>
      <Table label={label} density={density ?? LOOK_DENSITY[look]} hover={false}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} numeric={column.numeric} align={column.align} className={column.width}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const tone = rowTone?.(row);
            return (
              <TableRow key={rowKey(row)} className={tone && tone !== 'neutral' ? `kit-tone-${tone}` : undefined}>
                {columns.map((column, index) => (
                  <TableCell
                    key={column.id}
                    rowHeader={index === 0}
                    numeric={column.numeric}
                    align={column.align}
                    muted={column.muted}
                    wrap={column.nowrap ? 'nowrap' : undefined}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
