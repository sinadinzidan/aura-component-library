import { fireEvent, render, screen, within } from '@testing-library/react';

import { AlarmTable, type AlarmTableColumn } from './AlarmTable';

type Row = { id: string; text: string; count: number; acknowledged: boolean };

const ROWS: Row[] = [
  { id: 'a', text: 'Vibration high', count: 3, acknowledged: false },
  { id: 'b', text: 'Level deviation', count: 1, acknowledged: true },
];

const COLUMNS: AlarmTableColumn<Row>[] = [
  { id: 'text', header: 'Alarm', cell: (row) => row.text },
  { id: 'count', header: 'Count', numeric: true, cell: (row) => row.count },
];

function renderTable(onSelect = vi.fn(), selected?: string, rows: Row[] = ROWS) {
  render(
    <AlarmTable
      label="Standing alarms"
      columns={COLUMNS}
      rows={rows}
      rowKey={(row) => row.id}
      rowTone={(row) => (row.acknowledged ? 'warning' : 'critical')}
      rowEmphasis={(row) => (row.acknowledged ? 'edge' : 'band')}
      rowBadge={(row) => (row.acknowledged ? 'High' : 'Critical')}
      selected={selected}
      onSelect={onSelect}
      empty="No standing alarms."
    />
  );
  return onSelect;
}

describe(AlarmTable.name, () => {
  it('renders a named grid with a header per column and a row per alarm', () => {
    renderTable();

    const grid = screen.getByRole('grid', { name: 'Standing alarms' });
    expect(within(grid).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Priority', 'Alarm', 'Count']);
    expect(within(grid).getAllByRole('row')).toHaveLength(3);
  });

  it('carries the state tone, emphasis and badge on each row', () => {
    renderTable();

    const row = screen.getByText('Vibration high').closest('tr');
    expect(row).toHaveAttribute('data-tone', 'critical');
    expect(row).toHaveAttribute('data-emphasis', 'band');
    expect(row).toHaveTextContent('Critical');
    expect(screen.getByText('Level deviation').closest('tr')).toHaveAttribute('data-emphasis', 'edge');
  });

  it('marks the selected row', () => {
    renderTable(vi.fn(), 'b');

    expect(screen.getByText('Level deviation').closest('tr')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Vibration high').closest('tr')).toHaveAttribute('aria-selected', 'false');
  });

  it('selects a row on click', () => {
    const onSelect = renderTable();

    fireEvent.click(screen.getByText('Level deviation'));

    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('selects a row with Enter and Space, and ignores other keys', () => {
    const onSelect = renderTable();
    const row = screen.getByText('Vibration high').closest('tr');
    if (!row) throw new Error('row not found');

    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });
    fireEvent.keyDown(row, { key: 'a' });

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenLastCalledWith('a');
  });

  it('says so when there are no rows', () => {
    renderTable(vi.fn(), undefined, []);

    expect(screen.getByText('No standing alarms.')).toBeInTheDocument();
  });
});
