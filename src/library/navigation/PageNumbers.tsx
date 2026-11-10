import {
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@cognite/aura/components/pagination';
import type { KeyboardEvent } from 'react';

import { getPageItems } from './pageItems';

type PageNumbersProps = {
  /** Current page, starting at 1. */
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Adds jump-to-first and jump-to-last buttons. Worth it from roughly 10 pages. */
  showFirstLast?: boolean;
  /** Hides the numbered links and keeps only the arrows, for narrow footers. */
  arrowsOnly?: boolean;
};

function activateOnKey(action: () => void) {
  return (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    action();
  };
}

/**
 * The previous/next arrows and numbered links for a controlled page, with the middle collapsed to
 * ellipses on long lists. Render it inside Aura's `PaginationContent`. It owns clamping, the
 * disabled ends and keyboard activation, so a table only passes a page and a page count.
 */
export function PageNumbers({
  page,
  pageCount,
  onPageChange,
  showFirstLast = false,
  arrowsOnly = false,
}: PageNumbersProps) {
  const count = Math.max(1, Math.floor(pageCount));
  const current = Math.min(Math.max(1, Math.floor(page)), count);
  const isFirst = current <= 1;
  const isLast = current >= count;

  const linkProps = (target: number, disabled: boolean) => {
    const go = () => {
      if (!disabled && target !== current) onPageChange(target);
    };
    return { role: 'button', tabIndex: disabled ? -1 : 0, onClick: go, onKeyDown: activateOnKey(go) };
  };

  return (
    <>
      {showFirstLast ? (
        <PaginationItem>
          <PaginationFirst isDisabled={isFirst} {...linkProps(1, isFirst)} />
        </PaginationItem>
      ) : null}
      <PaginationItem>
        <PaginationPrevious isDisabled={isFirst} {...linkProps(current - 1, isFirst)} />
      </PaginationItem>
      {arrowsOnly
        ? null
        : getPageItems(current, count).map((item) =>
            typeof item === 'number' ? (
              <PaginationItem key={item}>
                <PaginationLink
                  isActive={item === current}
                  aria-label={`Page ${item}`}
                  {...linkProps(item, false)}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          )}
      <PaginationItem>
        <PaginationNext isDisabled={isLast} {...linkProps(current + 1, isLast)} />
      </PaginationItem>
      {showFirstLast ? (
        <PaginationItem>
          <PaginationLast isDisabled={isLast} {...linkProps(count, isLast)} />
        </PaginationItem>
      ) : null}
    </>
  );
}
