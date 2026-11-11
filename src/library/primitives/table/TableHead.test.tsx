import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TableHead } from './TableHead';

function renderHead(head: React.ReactNode) {
  return render(
    <table>
      <thead>
        <tr>{head}</tr>
      </thead>
    </table>
  );
}

describe(TableHead.name, () => {
  it('is a plain column header by default', () => {
    renderHead(<TableHead>Asset</TableHead>);

    const head = screen.getByRole('columnheader', { name: 'Asset' });
    expect(head).toHaveAttribute('scope', 'col');
    expect(head).not.toHaveAttribute('aria-sort');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each([
    ['asc', 'ascending'],
    ['desc', 'descending'],
    ['none', 'none'],
  ] as const)('announces sort direction %s as %s', (direction, expected) => {
    renderHead(
      <TableHead sortDirection={direction} onSort={() => {}}>
        Due
      </TableHead>
    );

    expect(screen.getByRole('columnheader', { name: 'Due' })).toHaveAttribute('aria-sort', expected);
  });

  it('calls onSort when the header button is activated from the keyboard', async () => {
    const onSort = vi.fn();
    renderHead(
      <TableHead sortDirection="none" onSort={onSort}>
        Due
      </TableHead>
    );

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it('right-aligns a numeric header', () => {
    renderHead(<TableHead numeric>Hours</TableHead>);

    expect(screen.getByRole('columnheader', { name: 'Hours' })).toHaveClass('text-right');
  });

  it('keeps a visually hidden header in the accessibility tree', () => {
    renderHead(<TableHead srOnly>Actions</TableHead>);

    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByText('Actions')).toHaveClass('sr-only');
  });
});
