import { render, screen } from '@testing-library/react';

import { Histogram } from './Histogram';
import { bucketize } from './stats';

const BINS = bucketize([41, 42, 42, 43, 43, 43, 44, 44, 47, 49], { bins: 5, min: 40, max: 50 });

describe(Histogram.name, () => {
  it('exposes the chart as an image named by its label', () => {
    render(<Histogram label="Distribution of discharge pressure" bins={BINS} />);

    expect(screen.getByRole('img', { name: 'Distribution of discharge pressure' })).toBeInTheDocument();
  });

  it('draws one bar per bin, scaled to the count axis', () => {
    const bins = [
      { from: 40, to: 42, count: 2 },
      { from: 42, to: 44, count: 4 },
    ];
    const { container } = render(<Histogram label="Pressure" bins={bins} unit="barg" countLabel="hours" />);

    const bars = container.querySelectorAll('[data-slot="histogram-bar"]');
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveStyle({ height: '50%' });
    expect(bars[1]).toHaveStyle({ height: '100%' });
    expect(bars[1]).toHaveAttribute('title', '42\u201344 barg: 4 hours');
  });

  it('places limit lines along the value axis with their label', () => {
    const { container } = render(<Histogram label="Pressure" bins={BINS} limits={[{ value: 48, label: 'High 48' }]} />);

    expect(container.querySelector('[data-slot="histogram-limit"]')).toHaveStyle({ left: '80%' });
    expect(screen.getByText('High 48')).toBeInTheDocument();
  });

  it('colours bins beyond a limit as out of range', () => {
    const { container } = render(<Histogram label="Pressure" bins={BINS} outside={{ high: 48 }} />);

    const bars = container.querySelectorAll('[data-slot="histogram-bar"]');
    expect(bars[4]).toHaveClass('bg-chart-warning-450');
    expect(bars[3]).toHaveClass('bg-chart-1-450');
  });

  it('prints the summary and survives no bins', () => {
    render(<Histogram label="Pressure" bins={[]} summary="No samples in range." />);

    expect(screen.getByText('No samples in range.')).toBeInTheDocument();
  });
});
