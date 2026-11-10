import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TablePagination } from './TablePagination';

describe(TablePagination.name, () => {
  it('describes the rows on the current page', () => {
    render(<TablePagination page={2} pageSize={25} total={1284} onPageChange={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('26–50 of 1,284 rows');
  });

  it('ends the range at the total on the last page', () => {
    render(<TablePagination page={52} pageSize={25} total={1284} onPageChange={vi.fn()} itemLabel="work orders" />);

    expect(screen.getByRole('status')).toHaveTextContent('1,276–1,284 of 1,284 work orders');
  });

  it('says so when there is nothing to page', () => {
    render(<TablePagination page={1} pageSize={25} total={0} onPageChange={vi.fn()} itemLabel="alarms" />);

    expect(screen.getByRole('status')).toHaveTextContent('No alarms');
  });

  it('clamps a page past the end', () => {
    render(<TablePagination page={9} pageSize={25} total={60} onPageChange={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('51–60 of 60 rows');
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
  });

  it('moves to the next page', async () => {
    const onPageChange = vi.fn();
    render(<TablePagination page={2} pageSize={25} total={1284} onPageChange={onPageChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('hides the page size select unless it can change', () => {
    render(<TablePagination page={1} pageSize={25} total={1284} onPageChange={vi.fn()} />);

    expect(screen.queryByRole('combobox', { name: 'rows per page' })).not.toBeInTheDocument();
  });

  it('keeps the first visible row on screen when the page size changes', async () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(
      <TablePagination
        page={5}
        pageSize={25}
        total={1284}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'rows per page' }));
    await userEvent.click(await screen.findByRole('option', { name: '50' }));

    expect(onPageSizeChange).toHaveBeenCalledWith(50);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
