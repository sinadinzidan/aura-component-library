import { Skeleton } from '@cognite/aura/components/skeleton';
import { useContext } from 'react';

import { cn } from '../../../lib/utils';

import { TABLE_CELL_DENSITY, TableContext } from './tableContext';

export type TableSkeletonRowsProps = {
  /** Match the number of rows that are expected. */
  rows?: number;
  /** Number of columns in the table. */
  columns: number;
  /** Announced once while the rows load. */
  label?: string;
};

const WIDTHS = ['w-3/4', 'w-1/2', 'w-2/3', 'w-2/5', 'w-4/5'] as const;

/**
 * Placeholder body rows for a table whose columns are known but whose rows are still loading.
 * The real header stays in place, so nothing moves when data arrives. Use on the base surface:
 * skeletons disappear on a card in the dark theme.
 */
export function TableSkeletonRows({ rows = 5, columns, label = 'Loading rows' }: TableSkeletonRowsProps) {
  const { density } = useContext(TableContext);

  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row} data-slot="table-skeleton-row" className="group/row">
          {Array.from({ length: columns }, (_, column) => (
            <td key={column} className={cn('border-b border-default group-last/row:border-b-0', TABLE_CELL_DENSITY[density])}>
              {row === 0 && column === 0 ? (
                <span role="status" className="sr-only">
                  {label}
                </span>
              ) : null}
              <Skeleton aria-hidden="true" className={cn('h-4', WIDTHS[(row + column * 2) % WIDTHS.length])} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
