import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DataTable } from './DataTable';
import type { DataTableColumn, DataTableSelection } from './DataTable';

type Pump = { id: string; name: string; hours: number };

const PUMPS: readonly Pump[] = [
  { id: 'p-b', name: 'Export pump B', hours: 120 },
  { id: 'p-a', name: 'Export pump A', hours: 4300 },
  { id: 'p-c', name: 'Cooling water pump', hours: 980 },
];

const COLUMNS: readonly DataTableColumn<Pump>[] = [
  { id: 'name', header: 'Name', cell: (pump) => pump.name, sortValue: (pump) => pump.name },
  { id: 'hours', header: 'Run hours', align: 'end', cell: (pump) => pump.hours, sortValue: (pump) => pump.hours, footer: '5,400' },
];

describe(DataTable.name, () => {
  it('renders a named table with a header and one row per record', () => {
    renderTable();

    const table = screen.getByRole('table', { name: 'Pumps' });
    expect(within(table).getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
    expect(bodyNames()).toEqual(['Export pump B', 'Export pump A', 'Cooling water pump']);
  });

  it('sorts ascending, then descending, then back to the given order', async () => {
    renderTable();
    const sortByHours = screen.getByRole('button', { name: /Run hours/ });

    await userEvent.click(sortByHours);
    expect(bodyNames()).toEqual(['Export pump B', 'Cooling water pump', 'Export pump A']);
    expect(screen.getByRole('columnheader', { name: /Run hours/ })).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(sortByHours);
    expect(bodyNames()).toEqual(['Export pump A', 'Cooling water pump', 'Export pump B']);

    await userEvent.click(sortByHours);
    expect(bodyNames()).toEqual(['Export pump B', 'Export pump A', 'Cooling water pump']);
  });

  it('applies the default sort', () => {
    renderTable({ defaultSort: { columnId: 'name', direction: 'asc' } });

    expect(bodyNames()).toEqual(['Cooling water pump', 'Export pump A', 'Export pump B']);
  });

  it('toggles a row through its checkbox', async () => {
    const selection = makeSelection();
    renderTable({ selection });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Export pump A' }));

    expect(selection.toggle).toHaveBeenCalledWith('p-a', true);
  });

  it('shows a mixed select-all checkbox for a partial selection', () => {
    renderTable({ selection: makeSelection({ partiallySelected: true }) });

    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toHaveAttribute('aria-checked', 'mixed');
  });

  it('selects all rows from the header', async () => {
    const selection = makeSelection();
    renderTable({ selection });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    expect(selection.toggleAll).toHaveBeenCalledWith(true);
  });

  it('expands and collapses a row', async () => {
    renderTable({ renderExpanded: (pump: Pump) => <p>Details for {pump.name}</p> });

    await userEvent.click(screen.getByRole('button', { name: 'Expand Export pump A' }));
    expect(screen.getByText('Details for Export pump A')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Collapse Export pump A' }));
    expect(screen.queryByText('Details for Export pump A')).not.toBeInTheDocument();
  });

  it('renders row actions and a summary row', () => {
    renderTable({ rowActions: (pump: Pump) => <button type="button">Open {pump.name}</button> });

    expect(screen.getByRole('button', { name: 'Open Export pump B' })).toBeInTheDocument();
    expect(screen.getByText('5,400')).toBeInTheDocument();
  });

  it('shows the empty content when there are no rows', () => {
    render(<DataTable label="Pumps" columns={COLUMNS} rows={[]} getRowId={(pump) => pump.id} empty={<p>No pumps match.</p>} />);

    expect(screen.getByText('No pumps match.')).toBeInTheDocument();
    expect(screen.queryByText('5,400')).not.toBeInTheDocument();
  });

  it('marks the current row', () => {
    renderTable({ currentRowId: 'p-a' });

    expect(screen.getByRole('row', { name: /Export pump A/ })).toHaveAttribute('aria-current', 'true');
  });
});

type Overrides = Partial<Pick<Parameters<typeof DataTable<Pump>>[0], 'defaultSort' | 'selection' | 'renderExpanded' | 'rowActions' | 'currentRowId'>>;

function renderTable(overrides: Overrides = {}) {
  return render(
    <DataTable
      label="Pumps"
      columns={COLUMNS}
      rows={PUMPS}
      getRowId={(pump) => pump.id}
      rowLabel={(pump) => pump.name}
      {...overrides}
    />
  );
}

function makeSelection(overrides: Partial<DataTableSelection> = {}): DataTableSelection {
  return {
    isSelected: vi.fn(() => false),
    toggle: vi.fn(),
    toggleAll: vi.fn(),
    allSelected: false,
    partiallySelected: false,
    ...overrides,
  };
}

function bodyNames(): string[] {
  const [, body] = screen.getAllByRole('rowgroup');
  return within(body)
    .getAllByRole('row')
    .map((row) => within(row).getAllByRole('cell')[0].textContent ?? '');
}
