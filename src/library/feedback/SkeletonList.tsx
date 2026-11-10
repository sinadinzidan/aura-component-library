import { Skeleton } from '@cognite/aura/components/skeleton';

type SkeletonListProps = {
  /** Match the page size, or the number of rows that fit without scrolling. */
  rows?: number;
  /** Leading circle, for lists whose rows start with an avatar or icon. */
  media?: boolean;
  /** Second, shorter line under the title. */
  description?: boolean;
  /** Short block at the end of the row, for a badge, value or timestamp. */
  trailing?: boolean;
  label?: string;
};

const TITLE_WIDTHS = ['w-2/5', 'w-1/2', 'w-1/3', 'w-3/5'] as const;
const DESCRIPTION_WIDTHS = ['w-3/5', 'w-2/5', 'w-1/2', 'w-1/3'] as const;

/**
 * Placeholder rows for a list. Line widths vary from row to row in a fixed pattern, so the list
 * reads as content on its way and not as a striped block.
 */
export function SkeletonList({
  rows = 4,
  media = true,
  description = true,
  trailing = false,
  label = 'Loading list',
}: SkeletonListProps) {
  return (
    <div role="status" aria-label={label} className="flex w-full flex-col gap-4">
      {Array.from({ length: Math.max(1, Math.floor(rows)) }, (_, index) => (
        <div key={index} data-slot="skeleton-row" className="flex items-center gap-3">
          {media ? (
            <div className="size-8 shrink-0 overflow-hidden rounded-full">
              <Skeleton className="size-full" />
            </div>
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className={`h-4 ${TITLE_WIDTHS[index % TITLE_WIDTHS.length]}`} />
            {description ? (
              <Skeleton className={`h-3 ${DESCRIPTION_WIDTHS[index % DESCRIPTION_WIDTHS.length]}`} />
            ) : null}
          </div>
          {trailing ? <Skeleton className="h-5 w-16 shrink-0" /> : null}
        </div>
      ))}
    </div>
  );
}
