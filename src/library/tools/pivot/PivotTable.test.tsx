import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { pivot } from './pivot';
import type { PivotRecord } from './pivot';
import { PivotTable } from './PivotTable';
import type { PivotTableProps } from './PivotTable';

const RECORDS: readonly PivotRecord[] = [
  { area: 'Compression', type: 'Corrective', month: 'Jan', hours: 8 },
  { area: 'Compression', type: 'Preventive', month: 'Feb', hours: 6 },
  { area: 'Export', type: 'Corrective', month: 'Feb', hours: 2 },
];

const RESULT = pivot(RECORDS, { rows: ['area', 'type'], column: 'month', measure: 'hours', aggregation: 'sum', order: { month: ['Jan', 'Feb'] } });

function renderTable(props: Partial<PivotTableProps> = {}) {
  return render(
    <PivotTable
      result={RESULT}
      rowFieldLabels={['Area', 'Type']}
      measureLabel="Labour hours"
      columnFieldLabel="Month"
      formatValue={(value) => (value === null ? '' : `${value} h`)}
      collapsed={new Set()}
      onToggleGroup={() => undefined}
      label="Labour by area"
      {...props}
    />
  );
}

describe(PivotTable.name, () => {
  it('shows a two-level header with the field names and a total column', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Area / Type' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Labour hours by month' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Jan' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Total' })).toBeInTheDocument();
  });

  it('shows groups with subtotals and a grand total', () => {
    renderTable();

    const compression = screen.getByRole('row', { name: /Compression/ });
    expect(within(compression).getByText('14 h')).toBeInTheDocument();
    const grand = screen.getByRole('row', { name: /Grand total/ });
    expect(within(grand).getAllByText('16 h').length).toBeGreaterThan(0);
  });

  it('marks an empty cell with a dash that is also named for screen readers', () => {
    renderTable();

    expect(screen.getAllByText('No records').length).toBeGreaterThan(0);
  });

  it('hides the children of a collapsed group', () => {
    renderTable({ collapsed: new Set(['Compression']) });

    expect(screen.queryByRole('row', { name: /Preventive/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Compression' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('asks to toggle a group', async () => {
    const onToggleGroup = vi.fn();
    renderTable({ onToggleGroup });

    await userEvent.click(screen.getByRole('button', { name: 'Collapse Export' }));

    expect(onToggleGroup).toHaveBeenCalledWith('Export');
  });

  it('drills through from a figure', async () => {
    const onDrill = vi.fn();
    renderTable({ onDrill });

    await userEvent.click(screen.getByRole('button', { name: /Compression, Jan: 8 h/ }));

    expect(onDrill).toHaveBeenCalledWith({ groupId: 'Compression', columnKey: 'Jan' });
  });

  it('drills through from the grand total', async () => {
    const onDrill = vi.fn();
    renderTable({ onDrill });

    await userEvent.click(screen.getByRole('button', { name: /^Grand total: 16 h/ }));

    expect(onDrill).toHaveBeenCalledWith({ groupId: null, columnKey: null });
  });

  it('marks the selected figure as pressed', () => {
    renderTable({ onDrill: () => undefined, selection: { groupId: 'Export', columnKey: 'Feb' } });

    expect(screen.getByRole('button', { name: /Export, Feb: 2 h/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shades leaf cells when heat is on and not otherwise', () => {
    const { unmount } = renderTable({ heat: true });
    expect(document.querySelectorAll('[class*="bg-heat-map"]').length).toBeGreaterThan(0);
    unmount();
    renderTable({ heat: false });
    expect(document.querySelectorAll('[class*="bg-heat-map"]')).toHaveLength(0);
  });

  it('shows the empty message when there is nothing to pivot', () => {
    renderTable({ result: pivot([], { rows: ['area'], column: 'month', measure: 'hours', aggregation: 'sum' }), empty: 'No work orders in this period' });

    expect(screen.getByText('No work orders in this period')).toBeInTheDocument();
  });

  it('shows placeholders while loading', () => {
    renderTable({ loading: true });

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Grand total')).not.toBeInTheDocument();
  });
});
