import { render, screen } from '@testing-library/react';

import { TableRow } from './TableRow';

function renderRow(row: React.ReactNode) {
  return render(
    <table>
      <tbody>{row}</tbody>
    </table>
  );
}

describe(TableRow.name, () => {
  it('has no selection state unless the table is selectable', () => {
    renderRow(
      <TableRow>
        <td>Row</td>
      </TableRow>
    );

    expect(screen.getByRole('row')).not.toHaveAttribute('aria-selected');
  });

  it('marks a selected row', () => {
    renderRow(
      <TableRow selected>
        <td>Row</td>
      </TableRow>
    );

    expect(screen.getByRole('row', { selected: true })).toHaveAttribute('data-selected');
  });

  it('marks an unselected row in a selectable table', () => {
    renderRow(
      <TableRow selected={false}>
        <td>Row</td>
      </TableRow>
    );

    expect(screen.getByRole('row')).toHaveAttribute('aria-selected', 'false');
  });

  it('marks the current row', () => {
    renderRow(
      <TableRow current>
        <td>Row</td>
      </TableRow>
    );

    expect(screen.getByRole('row')).toHaveAttribute('aria-current', 'true');
  });

  it('is positioned for a stretched action when interactive', () => {
    renderRow(
      <TableRow interactive>
        <td>Row</td>
      </TableRow>
    );

    expect(screen.getByRole('row')).toHaveClass('relative', 'cursor-pointer');
  });

  it('marks a disabled row and drops its hover', () => {
    renderRow(
      <TableRow disabled interactive>
        <td>Row</td>
      </TableRow>
    );

    const row = screen.getByRole('row');
    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(row).not.toHaveClass('cursor-pointer');
  });
});
