import { render, screen } from '@testing-library/react';

import { TableSkeletonRows } from './TableSkeletonRows';

describe(TableSkeletonRows.name, () => {
  it('renders the requested number of rows and columns', () => {
    render(
      <table>
        <tbody>
          <TableSkeletonRows rows={3} columns={4} />
        </tbody>
      </table>
    );

    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getAllByRole('cell')).toHaveLength(12);
  });

  it('announces loading once', () => {
    render(
      <table>
        <tbody>
          <TableSkeletonRows rows={3} columns={2} label="Loading work orders" />
        </tbody>
      </table>
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading work orders');
  });
});
