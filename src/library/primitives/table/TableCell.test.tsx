import { render, screen } from '@testing-library/react';

import { TableCell } from './TableCell';

function renderCell(cell: React.ReactNode) {
  return render(
    <table>
      <tbody>
        <tr>{cell}</tr>
      </tbody>
    </table>
  );
}

describe(TableCell.name, () => {
  it('wraps text and aligns to the start by default', () => {
    renderCell(<TableCell>Inlet separator</TableCell>);

    expect(screen.getByRole('cell')).toHaveClass('text-left', 'whitespace-normal');
  });

  it('right-aligns numbers in tabular figures on one line', () => {
    renderCell(<TableCell numeric>182 400</TableCell>);

    expect(screen.getByRole('cell')).toHaveClass('text-right', 'tabular-nums', 'whitespace-nowrap');
  });

  it('sets identifiers in monospace', () => {
    renderCell(<TableCell mono>23-KA-9101</TableCell>);

    expect(screen.getByRole('cell')).toHaveClass('font-mono');
  });

  it('truncates with an ellipsis and keeps the full text as a title', () => {
    renderCell(
      <TableCell wrap="truncate" title="Inspect recompressor drive-end bearing">
        Inspect recompressor drive-end bearing
      </TableCell>
    );

    const cell = screen.getByRole('cell');
    expect(cell).toHaveClass('truncate');
    expect(cell).toHaveAttribute('title', 'Inspect recompressor drive-end bearing');
  });

  it('lets an explicit alignment win over numeric', () => {
    renderCell(
      <TableCell numeric align="center">
        4
      </TableCell>
    );

    expect(screen.getByRole('cell')).toHaveClass('text-center');
  });

  it('renders a row header', () => {
    renderCell(<TableCell rowHeader>WO-104482</TableCell>);

    expect(screen.getByRole('rowheader', { name: 'WO-104482' })).toHaveAttribute('scope', 'row');
  });

  it('spans columns', () => {
    renderCell(<TableCell colSpan={3}>Total</TableCell>);

    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '3');
  });

  it('lifts an actions cell above a row-wide click target', () => {
    renderCell(<TableCell actions>Menu</TableCell>);

    expect(screen.getByRole('cell')).toHaveClass('relative', 'z-10', 'text-right');
  });
});
