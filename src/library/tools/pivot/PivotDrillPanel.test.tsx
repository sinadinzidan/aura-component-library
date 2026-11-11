import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PivotDrillPanel } from './PivotDrillPanel';
import type { DrillColumn } from './PivotDrillPanel';

const COLUMNS: readonly DrillColumn[] = [
  { field: 'id', title: 'Work order', mono: true },
  { field: 'hours', title: 'Hours', align: 'end', format: (value) => `${value} h` },
];

function renderPanel(records = [{ id: 'WO-104482', hours: 8 }, { id: 'WO-104479', hours: 3 }], onClose = () => undefined) {
  return render(
    <TooltipProvider>
      <PivotDrillPanel title="Compression, Jan" records={records} columns={COLUMNS} onClose={onClose} />
    </TooltipProvider>
  );
}

describe(PivotDrillPanel.name, () => {
  it('names the picked figure and counts its records', () => {
    renderPanel();

    expect(screen.getByRole('region', { name: 'Records for Compression, Jan' })).toBeInTheDocument();
    expect(screen.getByText('2 records')).toBeInTheDocument();
  });

  it('lists each record with formatted values', () => {
    renderPanel();

    expect(screen.getByText('WO-104482')).toBeInTheDocument();
    expect(screen.getByText('3 h')).toBeInTheDocument();
  });

  it('lays the records out as a named table with numbers right-aligned in tabular figures', () => {
    renderPanel();

    expect(screen.getByRole('table', { name: 'Compression, Jan records' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Work order', 'Hours']);
    expect(screen.getByRole('cell', { name: '8 h' })).toHaveClass('text-right', 'tabular-nums');
    expect(screen.getByRole('cell', { name: 'WO-104482' })).toHaveClass('font-mono');
  });

  it('keeps the column headers in view in a keyboard-reachable scroll area', () => {
    renderPanel();

    expect(screen.getByRole('region', { name: 'Compression, Jan records, scrollable' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('columnheader', { name: 'Hours' })).toHaveClass('sticky', 'top-0');
  });

  it('uses the singular for one record', () => {
    renderPanel([{ id: 'WO-104482', hours: 8 }]);

    expect(screen.getByText('1 record')).toBeInTheDocument();
  });

  it('says so when no records are behind the figure', () => {
    renderPanel([]);

    expect(screen.getByText('No records behind this figure')).toBeInTheDocument();
  });

  it('closes', async () => {
    const onClose = vi.fn();
    renderPanel(undefined, onClose);

    await userEvent.click(screen.getByRole('button', { name: 'Close records' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
