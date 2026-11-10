import {
  Pagination,
  PaginationContent,
  PaginationResultsPerPage,
  PaginationResultsPerPageLabel,
  PaginationSelectTrigger,
  PaginationStatus,
} from '@cognite/aura/components/pagination';
import { Select, SelectContent, SelectItem, SelectValue } from '@cognite/aura/components/select';

import { PageNumbers } from './PageNumbers';

const NUMBER = new Intl.NumberFormat('en-GB');

type TablePaginationProps = {
  /** Current page, starting at 1. */
  page: number;
  pageSize: number;
  /** Total number of rows across all pages. */
  total: number;
  onPageChange: (page: number) => void;
  /** Pass together with `pageSizeOptions` to show the rows-per-page select. */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  /** Plural noun for the range text: "rows", "work orders", "time series". */
  itemLabel?: string;
  size?: 'default' | 'small';
  showFirstLast?: boolean;
};

/**
 * The footer under a paged table: page links on the left, as Aura places them, and "26–50 of 1,284
 * rows" on the right. Changing the page size keeps the first visible row on screen instead of
 * jumping back to page one.
 */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  itemLabel = 'rows',
  size = 'default',
  showFirstLast = false,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const first = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const last = Math.min(current * pageSize, total);

  const changePageSize = (value: string) => {
    const nextSize = Number(value);
    if (!onPageSizeChange || !Number.isFinite(nextSize) || nextSize <= 0) return;
    onPageSizeChange(nextSize);
    const nextPage = Math.floor(Math.max(first - 1, 0) / nextSize) + 1;
    if (nextPage !== current) onPageChange(nextPage);
  };

  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <Pagination size={size} className="mx-0 w-auto justify-start">
        <PaginationContent>
          <PageNumbers page={current} pageCount={pageCount} onPageChange={onPageChange} showFirstLast={showFirstLast} />
          {onPageSizeChange ? (
            <PaginationResultsPerPage>
              <PaginationResultsPerPageLabel>Per page</PaginationResultsPerPageLabel>
              <Select value={String(pageSize)} onValueChange={changePageSize}>
                <PaginationSelectTrigger aria-label={`${itemLabel} per page`}>
                  <SelectValue />
                </PaginationSelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PaginationResultsPerPage>
          ) : null}
        </PaginationContent>
      </Pagination>
      <PaginationStatus>
        {total === 0
          ? `No ${itemLabel}`
          : `${NUMBER.format(first)}–${NUMBER.format(last)} of ${NUMBER.format(total)} ${itemLabel}`}
      </PaginationStatus>
    </div>
  );
}
