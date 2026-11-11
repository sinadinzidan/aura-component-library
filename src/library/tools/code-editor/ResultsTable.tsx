import { Table } from '../../primitives/table/Table';
import type { TableProps } from '../../primitives/table/Table';
import { TableBody } from '../../primitives/table/TableBody';
import { TableCaption } from '../../primitives/table/TableCaption';
import { TableCell } from '../../primitives/table/TableCell';
import { TableHead } from '../../primitives/table/TableHead';
import { TableHeader } from '../../primitives/table/TableHeader';
import { TableRow } from '../../primitives/table/TableRow';

import { describeRows } from './resultFormat';
import type { Cell, QueryResult } from './sqlTypes';

type ResultsTableProps = {
  result: Extract<QueryResult, { ok: true }>;
  /** Names the table for assistive technology: "Sensors above 40". */
  caption: string;
  /** Shown instead of the table when no rows came back. */
  emptyText?: string;
  /** Height utility for the scrolling area, for example `max-h-64`. */
  heightClassName?: string;
  /** The surface the results sit on, so the rows and the sticky header match it. */
  surface?: TableProps['surface'];
};

const isTag = (cell: Cell): boolean =>
  typeof cell === 'string' && /^[0-9A-Z-]+$/.test(cell) && cell.includes('-');

function formatCell(cell: Cell): string {
  if (cell === null) return '—';
  if (typeof cell === 'number')
    return Number.isInteger(cell)
      ? cell.toLocaleString('en-US')
      : cell.toLocaleString('en-US', { maximumFractionDigits: 3 });
  return String(cell);
}

/**
 * Query results as a semantic table: numbers align right in tabular figures, missing values show
 * a dash, the header stays in view while the rows scroll. A result with no rows says so in words.
 */
export function ResultsTable({
  result,
  caption,
  emptyText = 'No rows match. Loosen the conditions in WHERE.',
  heightClassName = 'max-h-72',
  surface = 'base',
}: ResultsTableProps) {
  const numeric = result.columns.map(
    (_, index) =>
      result.rows.some((row) => typeof row[index] === 'number') &&
      result.rows.every(
        (row) => typeof row[index] === 'number' || row[index] === null,
      ),
  );

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <output className="text-xs tabular-nums text-muted-foreground">
        {describeRows(result.rowCount, result.columns.length)}
      </output>
      {result.rowCount === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="min-w-0 rounded-lg border border-default">
          <Table
            label={caption}
            density="compact"
            stickyHeader
            surface={surface}
            className={heightClassName}
          >
            <TableCaption srOnly>{caption}</TableCaption>
            <TableHeader>
              <TableRow>
                {result.columns.map((column, index) => (
                  <TableHead key={column} numeric={numeric[index]}>
                    <span className="font-mono">{column}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, index) => (
                    <TableCell
                      key={index}
                      numeric={numeric[index]}
                      mono={isTag(cell)}
                      muted={cell === null}
                      wrap="nowrap"
                    >
                      {formatCell(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
