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
};

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

function defaultFormat(cell: Cell, column: QueryColumn): string {
  if (cell === null || cell === '') return '—';
  if (typeof cell === 'boolean') return cell ? 'Yes' : 'No';
  if (typeof cell === 'number') return column.kind === 'date' ? DATE.format(cell) : `${NUMBER.format(cell)}${column.unit ? ` ${column.unit}` : ''}`;
  return cell;
}

/**
 * The records a query matches, with a live count above. A plain table: ids and tags in
 * monospace, numbers right-aligned. When nothing matches it says so and suggests loosening the
 * query instead of showing an empty grid.
 */
export function ResultsTable({ columns, rows, recordKey, total, noun, limit = 12, fields = [], formatCell = defaultFormat }: ResultsTableProps) {
  const labelled = (cell: Cell, column: QueryColumn): string => {
    const option = typeof cell === 'string' ? fields.find((field) => field.key === column.key && field.kind === 'enum')?.options?.find((entry) => entry.value === cell) : undefined;
    return option ? option.label : formatCell(cell, column);
  };
  const shown = rows.slice(0, limit);
  return (
    <div data-slot="results" className="flex w-full min-w-0 flex-col gap-2">
      <p role="status" aria-live="polite" className="text-sm text-medium-foreground">
        <span className="font-semibold tabular-nums text-base-foreground">{rows.length}</span> of <span className="tabular-nums">{total}</span> {noun} match
      </p>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No {noun} match. Remove a condition or widen a range.</p>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Matching {noun}</caption>
            <thead>
              <tr className="border-b border-default text-xs text-muted-foreground">
                {columns.map((column) => (
                  <th key={column.key} scope="col" className={`px-3 py-2 font-medium whitespace-nowrap ${column.kind === 'number' ? 'text-right' : ''}`}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={String(row[recordKey])} className="border-b border-default last:border-b-0">
                  {columns.map((column, index) => {
                    const text = labelled(row[column.key] ?? null, column);
                    const mono = index === 0;
                    return index === 0 ? (
                      <th key={column.key} scope="row" className={`px-3 py-2 text-left font-normal whitespace-nowrap ${mono ? 'font-mono text-xs text-base-foreground' : ''}`}>
                        {text}
                      </th>
                    ) : (
                      <td key={column.key} className={`px-3 py-2 whitespace-nowrap text-medium-foreground ${column.kind === 'number' ? 'text-right tabular-nums' : column.kind === 'date' ? 'tabular-nums' : ''}`}>
                        {text}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > shown.length ? <p className="text-xs text-muted-foreground">Showing the first {shown.length}. Narrow the query to see the rest.</p> : null}
    </div>
  );
}
