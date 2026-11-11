import { render, screen } from '@testing-library/react';

import { TableMessageRow } from './TableMessageRow';

describe(TableMessageRow.name, () => {
  it('shows a message across every column', () => {
    render(
      <table>
        <tbody>
          <TableMessageRow colSpan={6}>No work orders match these filters.</TableMessageRow>
        </tbody>
      </table>
    );

    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '6');
    expect(screen.getByText('No work orders match these filters.')).toBeInTheDocument();
  });
});
