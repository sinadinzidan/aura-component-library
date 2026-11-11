import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Table } from './Table';
import { TableBody } from './TableBody';
import { TableCell } from './TableCell';
import { TableDetailRow } from './TableDetailRow';
import { TableExpandCell } from './TableExpandCell';
import { TableHead } from './TableHead';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';
import { TableSelectionCell } from './TableSelectionCell';
import { useTableSelection } from './useTableSelection';
import { useTableSort } from './useTableSort';

type Order = { id: string; hours: number };

const ORDERS: readonly Order[] = [
  { id: 'WO-104482', hours: 8 },
  { id: 'WO-104479', hours: 3 },
  { id: 'WO-104471', hours: 16 },
];
const ACCESSORS = { id: (order: Order) => order.id, hours: (order: Order) => order.hours };
const IDS = ORDERS.map((order) => order.id);

describe(Table.name, () => {
  it('names the table', () => {
    render(<Table label="Work orders">{null}</Table>);

    expect(screen.getByRole('table', { name: 'Work orders' })).toBeInTheDocument();
  });

  it('exposes the density for styling hooks', () => {
    render(
      <Table label="Work orders" density="compact">
        {null}
      </Table>
    );

    expect(screen.getByRole('table')).toHaveAttribute('data-density', 'compact');
  });

  it('makes a scrolling table a focusable, named region', () => {
    render(
      <Table label="Work orders" stickyHeader>
        {null}
      </Table>
    );

    const region = screen.getByRole('region', { name: 'Work orders, scrollable' });
    expect(region).toHaveAttribute('tabindex', '0');
  });

  it('does not make a table that fits focusable', () => {
    render(<Table label="Work orders">{null}</Table>);

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('sorts rows when a sortable header is clicked', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Hours' }));

    expect(rowIds()).toEqual(['WO-104479', 'WO-104482', 'WO-104471']);
    expect(screen.getByRole('columnheader', { name: 'Hours' })).toHaveAttribute('aria-sort', 'ascending');
  });

  it('reverses the order on a second click', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Hours' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hours' }));

    expect(rowIds()).toEqual(['WO-104471', 'WO-104482', 'WO-104479']);
    expect(screen.getByRole('columnheader', { name: 'Hours' })).toHaveAttribute('aria-sort', 'descending');
  });

  it('selects every row from the header checkbox', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all work orders' }));

    expect(screen.getAllByRole('row', { selected: true })).toHaveLength(3);
  });

  it('shows the header checkbox as indeterminate when some rows are selected', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select WO-104479' }));

    expect(screen.getByRole('checkbox', { name: 'Select all work orders' })).toHaveAttribute('aria-checked', 'mixed');
    expect(screen.getAllByRole('row', { selected: true })).toHaveLength(1);
  });

  it('opens and closes the detail of an expandable row', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Expand WO-104482' }));
    expect(screen.getByText('Detail of WO-104482')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Collapse WO-104482' }));
    expect(screen.queryByText('Detail of WO-104482')).not.toBeInTheDocument();
  });
});

function rowIds(): string[] {
  return screen.getAllByRole('rowheader').map((cell) => cell.textContent ?? '');
}

function Harness() {
  const sort = useTableSort({ rows: ORDERS, accessors: ACCESSORS });
  const selection = useTableSelection(IDS);
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Table label="Work orders">
      <TableHeader>
        <TableRow>
          <TableHead srOnly>Details</TableHead>
          <TableSelectionCell label="Select all work orders" {...selection.headerProps} />
          <TableHead {...sort.headProps('id')}>Work order</TableHead>
          <TableHead numeric {...sort.headProps('hours')}>
            Hours
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sort.rows.map((order) => (
          <OrderRows
            key={order.id}
            order={order}
            expanded={expanded === order.id}
            onExpandedChange={(open) => setExpanded(open ? order.id : null)}
            selected={selection.isSelected(order.id)}
            onSelectedChange={(checked) => selection.toggle(order.id, checked)}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function OrderRows({
  order,
  expanded,
  onExpandedChange,
  selected,
  onSelectedChange,
}: {
  order: Order;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  selected: boolean;
  onSelectedChange: (checked: boolean) => void;
}) {
  return (
    <>
      <TableRow selected={selected}>
        <TableExpandCell expanded={expanded} onExpandedChange={onExpandedChange} label={order.id} />
        <TableSelectionCell label={`Select ${order.id}`} checked={selected} onCheckedChange={onSelectedChange} />
        <TableCell rowHeader mono>
          {order.id}
        </TableCell>
        <TableCell numeric>{order.hours}</TableCell>
      </TableRow>
      {expanded ? <TableDetailRow colSpan={4}>Detail of {order.id}</TableDetailRow> : null}
    </>
  );
}
