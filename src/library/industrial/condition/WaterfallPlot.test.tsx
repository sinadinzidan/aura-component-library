import { render, screen } from '@testing-library/react';

import { WaterfallPlot } from './WaterfallPlot';

const spectrum = (peak: number) => Array.from({ length: 20 }, (_, index) => ({ frequencyHz: index * 10, amplitude: index === 5 ? peak : 0.1 }));
const traces = [1, 2, 3, 5].map((peak, index) => ({ id: `t${index}`, label: `Day ${index}`, spectrum: spectrum(peak) }));

describe(WaterfallPlot.name, () => {
  it('draws one trace per spectrum and marks the newest', () => {
    const { container } = render(<WaterfallPlot label="Waterfall" traces={traces} unit="mm/s" />);

    expect(screen.getByRole('img', { name: 'Waterfall' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="waterfall-trace"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-newest="true"]')).toHaveLength(1);
  });

  it('labels every row and states the tallest ridge', () => {
    render(<WaterfallPlot label="Waterfall" traces={traces} unit="mm/s" />);

    expect(screen.getByText('Day 3')).toBeInTheDocument();
    expect(screen.getByText(/tallest ridge 5.0/)).toBeInTheDocument();
  });

  it('copes with a single trace', () => {
    const { container } = render(<WaterfallPlot label="One" traces={traces.slice(0, 1)} unit="mm/s" />);

    expect(container.querySelectorAll('[data-slot="waterfall-trace"]')).toHaveLength(1);
  });
});
