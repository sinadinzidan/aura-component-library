import { render, screen } from '@testing-library/react';

import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { TableRow } from './TableRow';

describe(TableBody.name, () => {
  it('renders its rows in a body row group', () => {
    render(
      <table>
        <TableBody>
          <TableRow>
            <TableCell>Inlet separator</TableCell>
          </TableRow>
        </TableBody>
      </table>
    );

    expect(screen.getByRole('rowgroup').tagName).toBe('TBODY');
    expect(screen.getByRole('cell', { name: 'Inlet separator' })).toBeInTheDocument();
  });
});
