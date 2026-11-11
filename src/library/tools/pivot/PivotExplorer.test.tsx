import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { PivotRecord } from './pivot';
import { PivotExplorer } from './PivotExplorer';

const RECORDS: readonly PivotRecord[] = [
  { id: 'WO-1', area: 'Compression', type: 'Corrective', month: 'Jan', hours: 8, downtime: 4 },
  { id: 'WO-2', area: 'Compression', type: 'Preventive', month: 'Feb', hours: 6, downtime: 0 },
  { id: 'WO-3', area: 'Export', type: 'Corrective', month: 'Feb', hours: 2, downtime: 1 },
];

function renderExplorer(loading = false) {
  return render(
    <TooltipProvider>
      <PivotExplorer
        label="Work orders"
        records={RECORDS}
        dimensions={[{ id: 'area', label: 'Area' }, { id: 'type', label: 'Type' }, { id: 'month', label: 'Month' }]}
        measures={[{ id: 'hours', label: 'Labour hours' }, { id: 'downtime', label: 'Downtime' }]}
        initial={{ rows: ['area', 'type'], column: 'month', measure: 'hours', aggregation: 'sum' }}
        order={{ month: ['Jan', 'Feb'] }}
        measureFormat={{ hours: { decimals: 0, unit: 'h' }, downtime: { decimals: 1, unit: 'h' } }}
        drillColumns={[{ field: 'id', title: 'Work order', mono: true }]}
        loading={loading}
      />
    </TooltipProvider>
  );
}

describe(PivotExplorer.name, () => {
  it('shows the initial pivot with its totals', () => {
    renderExplorer();

    expect(screen.getByRole('table', { name: 'Work orders: sum of labour hours' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Compression/ })).toHaveTextContent('14');
  });

  it('collapses and expands every group', async () => {
    renderExplorer();

    await userEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.queryByRole('row', { name: /Preventive/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse all' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getAllByRole('row', { name: /Preventive/ }).length).toBeGreaterThan(0);
  });

  it('re-pivots when the aggregation changes', async () => {
    renderExplorer();

    await userEvent.click(screen.getByRole('tab', { name: 'Count' }));

    expect(screen.getByRole('table', { name: 'Work orders: count of records' })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Grand total/ })).toHaveTextContent('3');
  });

  it('opens the records behind a figure and closes them again', async () => {
    renderExplorer();

    await userEvent.click(screen.getByRole('button', { name: /Compression, Jan: 8\sh/ }));
    const panel = screen.getByRole('region', { name: 'Records for Compression, Jan' });
    expect(within(panel).getByText('WO-1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Close records' }));
    expect(screen.queryByRole('region', { name: /Records for/ })).not.toBeInTheDocument();
  });

  it('opens all records from the grand total', async () => {
    renderExplorer();

    await userEvent.click(screen.getByRole('button', { name: /^Grand total: 16\sh/ }));

    expect(screen.getByRole('region', { name: 'Records for All records' })).toBeInTheDocument();
    expect(screen.getByText('3 records', { selector: 'p' })).toBeInTheDocument();
  });

  it('shows a heat legend when heat shading is on', async () => {
    renderExplorer();

    await userEvent.click(screen.getByRole('switch'));

    expect(document.querySelector('[data-slot="heat-scale-legend"]')).toBeInTheDocument();
  });

  it('shows placeholders while loading', () => {
    renderExplorer(true);

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
  });
});
