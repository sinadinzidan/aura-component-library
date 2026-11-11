import { render, screen } from '@testing-library/react';

import { TableSectionRow } from './TableSectionRow';

describe(TableSectionRow.name, () => {
  it('is a header for the group of rows under it', () => {
    render(
      <table>
        <tbody>
          <TableSectionRow colSpan={4}>Gas compression</TableSectionRow>
        </tbody>
      </table>
    );

    const header = screen.getByRole('columnheader', { name: 'Gas compression' });
    expect(header).toHaveAttribute('scope', 'colgroup');
    expect(header).toHaveAttribute('colspan', '4');
  });

  it('shows how many rows the group holds', () => {
    render(
      <table>
        <tbody>
          <TableSectionRow colSpan={4} count={5}>
            Gas compression
          </TableSectionRow>
        </tbody>
      </table>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
