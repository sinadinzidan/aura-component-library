import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TableExpandCell } from './TableExpandCell';

function renderCell(cell: React.ReactNode) {
  return render(
    <table>
      <tbody>
        <tr>{cell}</tr>
      </tbody>
    </table>
  );
}

describe(TableExpandCell.name, () => {
  it('offers to expand a collapsed row by name', () => {
    renderCell(<TableExpandCell expanded={false} onExpandedChange={() => {}} label="WO-104482" />);

    expect(screen.getByRole('button', { name: 'Expand WO-104482' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('offers to collapse an expanded row and points at its detail', () => {
    renderCell(<TableExpandCell expanded onExpandedChange={() => {}} label="WO-104482" controls="detail-1" />);

    const button = screen.getByRole('button', { name: 'Collapse WO-104482' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', 'detail-1');
  });

  it('reports the next state when clicked', async () => {
    const onExpandedChange = vi.fn();
    renderCell(<TableExpandCell expanded={false} onExpandedChange={onExpandedChange} label="WO-104482" />);

    await userEvent.click(screen.getByRole('button'));

    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });
});
