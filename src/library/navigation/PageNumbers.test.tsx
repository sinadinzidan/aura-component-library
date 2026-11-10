import { Pagination, PaginationContent } from '@cognite/aura/components/pagination';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PageNumbers } from './PageNumbers';

describe(PageNumbers.name, () => {
  it('marks the current page', () => {
    renderPages({ page: 3, pageCount: 5 });

    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Page 2' })).not.toHaveAttribute('aria-current');
  });

  it('goes to a numbered page', async () => {
    const onPageChange = vi.fn();
    renderPages({ page: 3, pageCount: 5, onPageChange });

    await userEvent.click(screen.getByRole('button', { name: 'Page 5' }));

    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('steps forward and back', async () => {
    const onPageChange = vi.fn();
    renderPages({ page: 3, pageCount: 5, onPageChange });

    await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));

    expect(onPageChange.mock.calls).toEqual([[4], [2]]);
  });

  it('disables previous on the first page and next on the last', () => {
    const { unmount } = renderPages({ page: 1, pageCount: 5 });
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Go to next page' })).not.toHaveAttribute('aria-disabled');
    unmount();

    renderPages({ page: 5, pageCount: 5 });
    expect(screen.getByRole('button', { name: 'Go to next page' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('activates from the keyboard', async () => {
    const onPageChange = vi.fn();
    renderPages({ page: 1, pageCount: 5, onPageChange });

    screen.getByRole('button', { name: 'Page 2' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('does not report the page it is already on', async () => {
    const onPageChange = vi.fn();
    renderPages({ page: 2, pageCount: 5, onPageChange });

    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('adds first and last jumps on request', async () => {
    const onPageChange = vi.fn();
    renderPages({ page: 6, pageCount: 40, onPageChange, showFirstLast: true });

    await userEvent.click(screen.getByRole('button', { name: 'Go to last page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Go to first page' }));

    expect(onPageChange.mock.calls).toEqual([[40], [1]]);
  });

  it('collapses long lists and can drop the numbers entirely', () => {
    const { unmount } = renderPages({ page: 6, pageCount: 40 });
    expect(screen.queryByRole('button', { name: 'Page 20' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 40' })).toBeInTheDocument();
    unmount();

    renderPages({ page: 6, pageCount: 40, arrowsOnly: true });
    expect(screen.queryByRole('button', { name: 'Page 6' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument();
  });
});

type Options = {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
  showFirstLast?: boolean;
  arrowsOnly?: boolean;
};

function renderPages({ page, pageCount, onPageChange = () => undefined, showFirstLast, arrowsOnly }: Options) {
  return render(
    <Pagination>
      <PaginationContent>
        <PageNumbers
          page={page}
          pageCount={pageCount}
          onPageChange={onPageChange}
          showFirstLast={showFirstLast}
          arrowsOnly={arrowsOnly}
        />
      </PaginationContent>
    </Pagination>
  );
}
