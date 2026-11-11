import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { HeatGrid, type HeatGridRow } from './HeatGrid';

const ROWS: HeatGridRow[] = [
  { id: 'mon', label: 'Mon', values: [0, 4, 8] },
  { id: 'tue', label: 'Tue', values: [2, null, 6] },
];
const COLUMNS = ['00', '08', '16'];

describe(HeatGrid.name, () => {
  it('draws a cell per value and names the grid', () => {
    const { container } = render(<HeatGrid label="Alarms by hour and weekday" rows={ROWS} columns={COLUMNS} />);

    expect(screen.getByRole('img', { name: 'Alarms by hour and weekday' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-cell]')).toHaveLength(6);
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('prints values and marks a missing cell as no data', () => {
    const { container } = render(<HeatGrid label="Grid" rows={ROWS} columns={COLUMNS} showValues />);

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(container.querySelector('[data-cell="none"]')).toHaveAttribute('title', 'Tue, 08: no data');
  });

  it('colours negative values with the second tone on a diverging scale', () => {
    const { container } = render(<HeatGrid label="Grid" rows={[{ id: 'a', label: 'A', values: [-1, 1] }]} columns={['x', 'y']} tone="blue" negativeTone="amber" />);

    const tones = [...container.querySelectorAll('[data-cell]')].map((cell) => cell.getAttribute('data-tone'));
    expect(tones).toEqual(['amber', 'blue']);
  });

  it('reports the picked cell and marks the selected one', async () => {
    const onSelect = vi.fn();
    render(<HeatGrid label="Grid" rows={ROWS} columns={COLUMNS} selected={{ row: 'mon', column: 2 }} onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: 'Mon, 16: 8' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Tue, 00: 2' }));
    expect(onSelect).toHaveBeenCalledWith({ row: 'tue', column: 0 });
  });

  it('explains the colour scale', () => {
    render(<HeatGrid label="Grid" rows={ROWS} columns={COLUMNS} scale={{ label: 'Alarms per hour', low: '0', high: '8' }} />);

    expect(screen.getByText('Alarms per hour')).toBeInTheDocument();
  });
});
