import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TableHeader } from './TableHeader';
import { TableSelectionCell } from './TableSelectionCell';

describe(TableSelectionCell.name, () => {
  it('is a data cell with a named checkbox in a body row', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableSelectionCell label="Select WO-104482" checked={false} onCheckedChange={() => {}} />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByRole('cell')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select WO-104482' })).not.toBeChecked();
  });

  it('is a column header inside the table header', () => {
    render(
      <table>
        <TableHeader>
          <tr>
            <TableSelectionCell label="Select all rows" checked={false} onCheckedChange={() => {}} />
          </tr>
        </TableHeader>
      </table>
    );

    expect(screen.getByRole('columnheader')).toHaveAttribute('scope', 'col');
  });

  it('reports the next checked state', async () => {
    const onCheckedChange = vi.fn();
    render(
      <table>
        <tbody>
          <tr>
            <TableSelectionCell label="Select WO-104482" checked={false} onCheckedChange={onCheckedChange} />
          </tr>
        </tbody>
      </table>
    );

    await userEvent.click(screen.getByRole('checkbox'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('shows a mixed state when indeterminate', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableSelectionCell label="Select all rows" checked={false} indeterminate onCheckedChange={() => {}} />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('can be disabled', () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableSelectionCell label="Select all rows" checked={false} disabled onCheckedChange={() => {}} />
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-disabled', 'true');
  });
});
