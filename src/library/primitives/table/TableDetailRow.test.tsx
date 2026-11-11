import { render, screen } from '@testing-library/react';

import { TableDetailRow } from './TableDetailRow';

describe(TableDetailRow.name, () => {
  it('spans the table and carries the id its expand button controls', () => {
    render(
      <table>
        <tbody>
          <TableDetailRow colSpan={5} id="detail-1">
            Bearing temperature rose 12 °C in two hours.
          </TableDetailRow>
        </tbody>
      </table>
    );

    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '5');
    expect(screen.getByRole('row')).toHaveAttribute('id', 'detail-1');
    expect(screen.getByText('Bearing temperature rose 12 °C in two hours.')).toBeInTheDocument();
  });
});
