import { Table } from '../../primitives/table/Table';
import type { TableProps } from '../../primitives/table/Table';
import { TableBody } from '../../primitives/table/TableBody';
import { TableCell } from '../../primitives/table/TableCell';
import { TableHead } from '../../primitives/table/TableHead';
import { TableHeader } from '../../primitives/table/TableHeader';
import { TableRow } from '../../primitives/table/TableRow';

import type { Cell, QueryColumn, QueryField, QueryRecord } from './queryModel';

type ResultsTableProps = {
  columns: readonly QueryColumn[];
  rows: readonly QueryRecord[];
  recordKey: string;
  /** Total records in the data set, for "12 of 40". */
  total: number;
  /** Plural noun: "work orders". */
  noun: string;
  /** Most rows to draw; the count above always shows every match. */
  limit?: number;
  /** The data set's fields; enum cells are shown by option label. */
  fields?: readonly QueryField[];
  /** Turns a cell into text. Defaults handle numbers, booleans, dates and nulls. */
  formatCell?: (cell: Cell, column: QueryColumn) => string;
  /** The surface the results sit on, so the rows match it. `card` by default: the query builder shows results inside its card. */
  surface?: TableProps['surface'];
};

const DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function defaultFormat(cell: Cell, column: QueryColumn): string {
  if (cell === null || cell === '') return '—';
  if (typeof cell === 'boolean') return cell ? 'Yes' : 'No';
  if (typeof cell === 'number')
    return column.kind === 'date'
      ? DATE.format(cell)
      : `${NUMBER.format(cell)}${column.unit ? ` ${column.unit}` : ''}`;
  return cell;
}

/**
 * The records a query matches, with a live count above. A plain table: ids and tags in
 * monospace, numbers right-aligned. When nothing matches it says so and suggests loosening the
 * query instead of showing an empty grid.
 */
export function ResultsTable({
  columns,
  rows,
  recordKey,
  total,
  noun,
  limit = 12,
  fields = [],
  formatCell = defaultFormat,
  surface = 'card',
}: ResultsTableProps) {
  const labelled = (cell: Cell, column: QueryColumn): string => {
    const option =
      typeof cell === 'string'
        ? fields
            .find((field) => field.key === column.key && field.kind === 'enum')
            ?.options?.find((entry) => entry.value === cell)
        : undefined;
    return option ? option.label : formatCell(cell, column);
  };
  const shown = rows.slice(0, limit);
  return (
    <div data-slot="results" className="flex w-full min-w-0 flex-col gap-2">
      <p
        role="status"
        aria-live="polite"
        className="text-sm text-medium-foreground"
      >
        <span className="font-semibold tabular-nums text-base-foreground">
          {rows.length}
        </span>{' '}
        of <span className="tabular-nums">{total}</span> {noun} match
      </p>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No {noun} match. Remove a condition or widen a range.
        </p>
      ) : (
        <Table label={`Matching ${noun}`} scrollable surface={surface}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} numeric={column.kind === 'number'}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((row) => (
              <TableRow key={String(row[recordKey])}>
                {columns.map((column, index) => {
                  const text = labelled(row[column.key] ?? null, column);
                  return index === 0 ? (
                    <TableCell key={column.key} rowHeader mono>
                      <span className="font-normal">{text}</span>
                    </TableCell>
                  ) : (
                    <TableCell
                      key={column.key}
                      numeric={column.kind === 'number'}
                      wrap="nowrap"
                    >
                      {column.kind === 'date' ? (
                        <span className="tabular-nums">{text}</span>
                      ) : (
                        text
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {rows.length > shown.length ? (
        <p className="text-xs text-muted-foreground">
          Showing the first {shown.length}. Narrow the query to see the rest.
        </p>
      ) : null}
    </div>
  );
}
