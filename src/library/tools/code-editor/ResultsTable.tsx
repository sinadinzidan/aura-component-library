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
};

function formatCell(cell: Cell): string {
  if (cell === null) return '—';
  if (typeof cell === 'number') return Number.isInteger(cell) ? cell.toLocaleString('en-US') : cell.toLocaleString('en-US', { maximumFractionDigits: 3 });
  return String(cell);
}

/**
 * Query results as a semantic table: numbers align right in tabular figures, missing values show
 * a dash, the header stays in view while the rows scroll. A result with no rows says so in words.
 */
export function ResultsTable({ result, caption, emptyText = 'No rows match. Loosen the conditions in WHERE.', heightClassName = 'max-h-72' }: ResultsTableProps) {
  const numeric = result.columns.map((_, index) => result.rows.some((row) => typeof row[index] === 'number') && result.rows.every((row) => typeof row[index] === 'number' || row[index] === null));

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <output className="text-xs tabular-nums text-muted-foreground">{describeRows(result.rowCount, result.columns.length)}</output>
      {result.rowCount === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className={`${heightClassName} min-w-0 overflow-auto rounded-lg border border-default`} tabIndex={0} role="region" aria-label={caption}>
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="sticky top-0 bg-muted-background">
              <tr>
                {result.columns.map((column, index) => (
                  <th key={column} scope="col" className={`whitespace-nowrap px-3 py-2 font-mono text-xs font-medium text-muted-foreground ${numeric[index] ? 'text-right' : 'text-left'}`}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-default">
                  {row.map((cell, index) => (
                    <td key={index} className={`whitespace-nowrap px-3 py-1.5 ${numeric[index] ? 'text-right tabular-nums' : 'text-left'} ${cell === null ? 'text-muted-foreground' : 'text-base-foreground'} ${typeof cell === 'string' && /^[0-9A-Z-]+$/.test(cell) && cell.includes('-') ? 'font-mono text-xs' : ''}`}>
                      {formatCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
