import { render, screen } from '@testing-library/react';

import { BoxPlotRows } from './BoxPlotRows';
import type { BoxPlotRow } from './BoxPlotRows';

const ROWS: readonly BoxPlotRow[] = [
  { label: '1st stage', stats: { min: 20, q1: 40, median: 50, q3: 60, max: 80 } },
  { label: 'Recompressor', stats: { min: 30, q1: 50, median: 70, q3: 90, max: 100 }, tone: 'warning' },
];

describe(BoxPlotRows.name, () => {
  it('lists one row per asset under an accessible name', () => {
    render(<BoxPlotRows label="Vibration spread per compressor" rows={ROWS} domain={[0, 100]} />);

    expect(screen.getByRole('list', { name: 'Vibration spread per compressor' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Recompressor')).toBeInTheDocument();
  });

  it('positions the whisker, box and median on the shared scale', () => {
    const { container } = render(<BoxPlotRows label="Spread" rows={ROWS} domain={[0, 100]} />);

    expect(container.querySelector('[data-slot="box-plot-whisker"]')).toHaveStyle({ left: '20%', width: '60%' });
    expect(container.querySelector('[data-slot="box-plot-box"]')).toHaveStyle({ left: '40%', width: '20%' });
    expect(container.querySelector('[data-slot="box-plot-median"]')).toHaveStyle({ left: '50%' });
  });

  it('describes each row for assistive technology', () => {
    render(<BoxPlotRows label="Spread" rows={ROWS} domain={[0, 100]} unit="mm/s" />);

    expect(screen.getByText(/median 50\.0\smm\/s, range 20\.0 to 80\.0/)).toBeInTheDocument();
  });

  it('colours a row by its tone', () => {
    const { container } = render(<BoxPlotRows label="Spread" rows={ROWS} domain={[0, 100]} />);

    const boxes = container.querySelectorAll('[data-slot="box-plot-box"]');
    expect(boxes[0]).toHaveClass('bg-chart-1-200');
    expect(boxes[1]).toHaveClass('bg-chart-warning-200');
  });

  it('draws the limit across the rows with its label', () => {
    const { container } = render(<BoxPlotRows label="Spread" rows={ROWS} domain={[0, 100]} limit={{ value: 75, label: 'High 75' }} />);

    expect(container.querySelector('[data-slot="box-plot-limit"]')).toHaveStyle({ left: '75%' });
    expect(screen.getByText('High 75')).toBeInTheDocument();
  });

  it('derives a round scale from the data when no domain is given', () => {
    render(<BoxPlotRows label="Spread" rows={ROWS} summary="Recompressor runs highest." />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('Recompressor runs highest.')).toBeInTheDocument();
  });
});
