import { render, screen } from '@testing-library/react';

import { TableCell } from './TableCell';
import { TableFooter } from './TableFooter';
import { TableRow } from './TableRow';

describe(TableFooter.name, () => {
  it('renders its row in a footer row group', () => {
    render(
      <table>
        <TableFooter>
          <TableRow>
            <TableCell numeric>42</TableCell>
          </TableRow>
        </TableFooter>
      </table>
    );

    expect(screen.getByRole('rowgroup').tagName).toBe('TFOOT');
  });

  it('sets totals in medium weight', () => {
    render(
      <table>
        <TableFooter>
          <TableRow>
            <TableCell numeric>42</TableCell>
          </TableRow>
        </TableFooter>
      </table>
    );

    expect(screen.getByRole('cell', { name: '42' })).toHaveClass('font-medium');
  });
});
