import { Button } from '@cognite/aura/components/button';

type SelectionBannerProps = {
  /** Rows on the current page, all of which are selected. */
  pageCount: number;
  /** Rows across every page that match the current filters. */
  totalCount: number;
  /** The selection now covers every page. */
  allPagesSelected: boolean;
  /** Singular and plural noun for the rows. */
  noun: { one: string; other: string };
  onSelectAllPages: () => void;
  onClear: () => void;
};

const NUMBER = new Intl.NumberFormat('en-US');

/**
 * The line that appears above a paged table once every row on the page is selected: it says how
 * far the selection reaches and offers to extend it to every page, so "select all" never silently
 * means 25 rows to one person and 312 to another. Render it only while the page is fully selected.
 */
export function SelectionBanner({ pageCount, totalCount, allPagesSelected, noun, onSelectAllPages, onClear }: SelectionBannerProps) {
  const word = (count: number) => (count === 1 ? noun.one : noun.other);
  const hasMore = totalCount > pageCount;

  return (
    <div
      role="status"
      className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg bg-muted-background px-3 py-1.5 text-sm text-medium-foreground"
    >
      <span>
        {allPagesSelected
          ? `All ${NUMBER.format(totalCount)} ${word(totalCount)} are selected.`
          : `All ${NUMBER.format(pageCount)} ${word(pageCount)} on this page are selected.`}
      </span>
      {allPagesSelected ? (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear selection
        </Button>
      ) : hasMore ? (
        <Button variant="ghost" size="sm" onClick={onSelectAllPages}>
          Select all {NUMBER.format(totalCount)} {word(totalCount)}
        </Button>
      ) : null}
    </div>
  );
}
