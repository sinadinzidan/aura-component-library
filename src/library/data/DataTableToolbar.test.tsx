import { DataGrid } from '@cognite/aura/data-grid';
import type { ColumnDef } from '@cognite/aura/data-grid';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { DataTableToolbar } from './DataTableToolbar';

type Order = { id: string; title: string };

const ORDERS: Order[] = [
  { id: 'WO-1', title: 'Inspect bearing' },
  { id: 'WO-2', title: 'Replace transmitter' },
  { id: 'WO-3', title: 'Clean cooler' },
];

const COLUMNS: ColumnDef<Order>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'title', header: 'Title' },
];

describe(DataTableToolbar.name, () => {
  it('shows the title and how many rows there are', () => {
    renderToolbar();

    expect(screen.getByText('Work orders')).toBeInTheDocument();
    expect(screen.getByText('3 work orders')).toBeInTheDocument();
  });

  it('uses the singular noun for one row', () => {
    renderToolbar({ data: ORDERS.slice(0, 1) });

    expect(screen.getByText('1 work order')).toBeInTheDocument();
  });

  it('filters the grid from the search field and updates the count', async () => {
    renderToolbar();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search work orders' }), 'cooler');

    expect(screen.getByText('1 of 3 work orders')).toBeInTheDocument();
  });

  it('has no search field unless a search label is given', () => {
    renderToolbar({ searchable: false });

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('renders actions at the end', () => {
    renderToolbar({ actions: <button type="button">Create work order</button> });

    expect(screen.getByRole('button', { name: 'Create work order' })).toBeInTheDocument();
  });
});

function renderToolbar({
  data = ORDERS,
  searchable = true,
  actions,
}: { data?: Order[]; searchable?: boolean; actions?: ReactNode } = {}) {
  return render(
    <DataGrid data={data} columns={COLUMNS} getRowId={(order) => order.id} aria-label="Work orders">
      <DataTableToolbar title="Work orders" noun={['work order', 'work orders']} searchLabel={searchable ? 'Search work orders' : undefined}
        actions={actions}
      />
    </DataGrid>
  );
}
