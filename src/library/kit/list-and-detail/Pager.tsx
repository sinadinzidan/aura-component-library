import { IconChevronLeft, IconChevronRight } from '@cognite/aura/icons';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import './records.css';

type PagerProps = {
  /** Current page, starting at 1. */
  page: number;
  pageSize: number;
  /** Number of records in the whole list. */
  total: number;
  /** What the records are, plural: "work orders". */
  noun: string;
  onPage?: (page: number) => void;
  className?: string;
};

/** Which records are shown and the way to the others: "1–6 of 23 work orders", page buttons, previous and next. */
export function Pager({ page, pageSize, total, noun, onPage, className }: PagerProps) {
  const look = useLook();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav aria-label={`${noun} pages`} data-look={look} className={cx('rec-pager', className)}>
      <span>
        {first}–{last} of {total} {noun}
      </span>
      <span className="rec-pager-pages">
        <button type="button" className="rec-pager-button" aria-label="Previous page" disabled={page <= 1} onClick={() => onPage?.(page - 1)}>
          <IconChevronLeft aria-hidden="true" />
        </button>
        {pages.map((number) => (
          <button key={number} type="button" className="rec-pager-button" aria-label={`Page ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => onPage?.(number)}>
            {number}
          </button>
        ))}
        <button type="button" className="rec-pager-button" aria-label="Next page" disabled={page >= pageCount} onClick={() => onPage?.(page + 1)}>
          <IconChevronRight aria-hidden="true" />
        </button>
      </span>
    </nav>
  );
}
