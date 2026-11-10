import { Skeleton } from '@cognite/aura/components/skeleton';

type SkeletonTableProps = {
  /** Match the page size of the real table. */
  rows?: number;
  /** Real column headers when they are known, or a number of columns when they are not. */
  columns: readonly string[] | number;
  label?: string;
};

const CELL_WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-2/5', 'w-4/5'] as const;

/**
 * Placeholder for a table body. Pass the real column headers when they are known, so the header
 * row is already correct and only the cells are replaced when data arrives.
 */
export function SkeletonTable({ rows = 5, columns, label = 'Loading table' }: SkeletonTableProps) {
  const headers = typeof columns === 'number' ? null : columns;
  const columnCount = Math.max(1, typeof columns === 'number' ? Math.floor(columns) : columns.length);
  const gridTemplateColumns = `repeat(${columnCount}, minmax(0, 1fr))`;

  return (
    <div role="status" aria-label={label} className="w-full text-sm">
      <div className="grid gap-4 border-b border-default pb-3" style={{ gridTemplateColumns }}>
        {Array.from({ length: columnCount }, (_, column) =>
          headers ? (
            <span key={column} className="truncate text-xs font-medium text-muted-foreground">
              {headers[column]}
            </span>
          ) : (
            <Skeleton key={column} className="h-3 w-1/2" />
          )
        )}
      </div>
      {Array.from({ length: Math.max(1, Math.floor(rows)) }, (_, row) => (
        <div key={row} data-slot="skeleton-row" className="grid items-center gap-4 py-3" style={{ gridTemplateColumns }}>
          {Array.from({ length: columnCount }, (_, column) => (
            <Skeleton key={column} className={`h-4 ${CELL_WIDTHS[(row + column * 2) % CELL_WIDTHS.length]}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
