import { render, screen } from '@testing-library/react';

import { BoxRows, type BoxRow } from './BoxRows';

const ROWS: BoxRow[] = [
  { id: 'a', label: '1st stage compressor', sublabel: '23-KA-9101', stats: { min: 2, q1: 4, median: 5, q3: 6, max: 9 } },
  { id: 'b', label: 'Recompressor', stats: { min: 3, q1: 6, median: 8, q3: 10, max: 12 }, tone: 'critical' },
];

describe(BoxRows.name, () => {
  it('draws one box per row with its label and median', () => {
    const { container } = render(<BoxRows label="Vibration per unit" rows={ROWS} min={0} max={15} unit="mm/s" />);

    expect(screen.getByRole('img', { name: 'Vibration per unit' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-box]')).toHaveLength(2);
    expect(screen.getByText('1st stage compressor')).toBeInTheDocument();
    expect(screen.getByText('23-KA-9101')).toBeInTheDocument();
    expect(screen.getByText('8.0')).toBeInTheDocument();
  });

  it('places the box between the quartiles on the shared scale', () => {
    const { container } = render(<BoxRows label="Vibration" rows={ROWS.slice(0, 1)} min={0} max={10} />);

    const box = container.querySelector<HTMLElement>('[data-box]');
    expect(box?.style.left).toBe('40.00%');
    expect(container.querySelector<HTMLElement>('[data-median]')?.style.left).toBe('50.00%');
  });

  it('draws the limit through every row and names it once', () => {
    const { container } = render(<BoxRows label="Vibration" rows={ROWS} min={0} max={15} limit={{ value: 11, label: 'Trip' }} />);

    expect(container.querySelectorAll('[data-limit]')).toHaveLength(2);
    expect(screen.getByText('Trip 11.0')).toBeInTheDocument();
  });
});
