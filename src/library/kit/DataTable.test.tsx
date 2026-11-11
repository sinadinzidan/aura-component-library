import { render, screen, within } from '@testing-library/react';

import { DataTable, type DataTableColumn } from './DataTable';

type Order = { id: string; title: string; hours: number };

const ROWS: Order[] = [
  { id: 'WO-1', title: 'Inspect bearing', hours: 8 },
  { id: 'WO-2', title: 'Replace transmitter', hours: 3 },
];

const COLUMNS: DataTableColumn<Order>[] = [
  { id: 'title', header: 'Work order', cell: (order) => order.title },
  { id: 'hours', header: 'Hours', numeric: true, cell: (order) => order.hours },
];

describe(DataTable.name, () => {
  it('renders a named table with a header per column', () => {
    render(<DataTable label="Work orders" columns={COLUMNS} rows={ROWS} rowKey={(order) => order.id} />);

    const table = screen.getByRole('table', { name: 'Work orders' });
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Work order', 'Hours']);
  });

  it('names each row by its first cell', () => {
    render(<DataTable label="Work orders" columns={COLUMNS} rows={ROWS} rowKey={(order) => order.id} />);

    expect(screen.getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual(['Inspect bearing', 'Replace transmitter']);
  });

  it('marks the tone of a row for the status edge', () => {
    render(
      <DataTable label="Work orders" columns={COLUMNS} rows={ROWS} rowKey={(order) => order.id} rowTone={(order) => (order.hours > 5 ? 'critical' : undefined)} />
    );

    const [, first, second] = screen.getAllByRole('row');
    expect(first).toHaveClass('kit-tone-critical');
    expect(second.className).not.toMatch(/kit-tone-/);
  });
});
