export type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

/** Most page slots shown before the middle collapses: first, last, current, two neighbours, two gaps. */
const MAX_SLOTS = 7;

function range(start: number, end: number): number[] {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
}

/**
 * The page numbers to show for a 1-based `page` out of `pageCount`: always the first and last page,
 * the current page with one neighbour on each side, and an ellipsis for each gap. The list keeps
 * the same length while paging, so the next and previous buttons do not move under the pointer.
 */
export function getPageItems(page: number, pageCount: number): PageItem[] {
  const count = Math.max(1, Math.floor(pageCount));
  const current = Math.min(Math.max(1, Math.floor(page)), count);

  if (count <= MAX_SLOTS) return range(1, count);
  if (current <= 4) return [...range(1, 5), 'end-ellipsis', count];
  if (current >= count - 3) return [1, 'start-ellipsis', ...range(count - 4, count)];
  return [1, 'start-ellipsis', current - 1, current, current + 1, 'end-ellipsis', count];
}
