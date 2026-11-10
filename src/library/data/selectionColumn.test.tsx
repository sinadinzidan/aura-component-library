import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { selectionColumn } from './selectionColumn';

type Order = { id: string; title: string };

const ORDERS: Order[] = [
  { id: 'WO-1', title: 'Inspect bearing' },
  { id: 'WO-2', title: 'Replace transmitter' },
  { id: 'WO-3', title: 'Clean cooler' },
];

const COLUMNS: ColumnDef<Order>[] = [
  selectionColumn<Order>({ getRowLabel: (order) => order.id }),
  { accessorKey: 'title', header: 'Title' },
];

describe(selectionColumn.name, () => {
  it('is a narrow, unsortable column with the id the grid expects', () => {
    const column = selectionColumn<Order>();

    expect(column).toMatchObject({ id: 'select', size: 44, enableSorting: false });
  });

  it('selects one row from its checkbox', async () => {
    renderTable();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select WO-2' }));

    expect(screen.getByTestId('selected')).toHaveTextContent('WO-2');
  });

  it('selects every row from the header checkbox', async () => {
    renderTable();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    expect(screen.getByTestId('selected')).toHaveTextContent('WO-1,WO-2,WO-3');
  });

  it('shows the header checkbox as mixed when only some rows are selected', async () => {
    renderTable();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select WO-1' }));

    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toHaveAttribute('aria-checked', 'mixed');
  });

  it('clears the selection when the header checkbox is unchecked', async () => {
    renderTable();
    const selectAll = screen.getByRole('checkbox', { name: 'Select all rows' });

    await userEvent.click(selectAll);
    await userEvent.click(selectAll);

    expect(screen.getByTestId('selected')).toBeEmptyDOMElement();
  });

  it('disables the checkbox of a row that cannot be selected', () => {
    renderTable({ canSelect: (order) => order.id !== 'WO-3' });

    expect(screen.getByRole('checkbox', { name: 'Select WO-3' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('falls back to a generic row label', () => {
    render(<Harness columns={[selectionColumn<Order>()]} />);

    expect(screen.getAllByRole('checkbox', { name: 'Select row' })).toHaveLength(3);
  });
});

function Harness({
  columns = COLUMNS,
  canSelect,
}: {
  columns?: ColumnDef<Order>[];
  canSelect?: (order: Order) => boolean;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // eslint-disable-next-line react-hooks/incompatible-library -- a test harness; nothing here is memoized
  const table = useReactTable({
    data: ORDERS,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: canSelect ? (row) => canSelect(row.original) : true,
    getRowId: (order) => order.id,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      {table.getFlatHeaders().map((header) => (
        <div key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</div>
      ))}
      {table.getRowModel().rows.map((row) => (
        <div key={row.id}>
          {row.getVisibleCells().map((cell) => (
            <span key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
          ))}
        </div>
      ))}
      <output data-testid="selected">{Object.keys(rowSelection).join(',')}</output>
    </div>
  );
}

function renderTable(props: { canSelect?: (order: Order) => boolean } = {}) {
  return render(<Harness {...props} />);
}
