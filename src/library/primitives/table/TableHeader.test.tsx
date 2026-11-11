import { render, screen } from '@testing-library/react';

import { TableHead } from './TableHead';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

describe(TableHeader.name, () => {
  it('renders its rows in a header row group', () => {
    render(
      <table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset</TableHead>
          </TableRow>
        </TableHeader>
      </table>
    );

    expect(screen.getByRole('rowgroup').tagName).toBe('THEAD');
    expect(screen.getByRole('columnheader', { name: 'Asset' })).toBeInTheDocument();
  });

  it('does not mark header rows as selectable', () => {
    render(
      <table>
        <TableHeader>
          <TableRow selected={false}>
            <TableHead>Asset</TableHead>
          </TableRow>
        </TableHeader>
      </table>
    );

    expect(screen.getByRole('row')).not.toHaveAttribute('aria-selected');
  });
});
