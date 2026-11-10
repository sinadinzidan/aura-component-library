import { render, screen } from '@testing-library/react';

import { ParetoChart, paretoSummary } from './ParetoChart';

const CAUSES = [
  { label: 'Seal leak', value: 6 },
  { label: 'Compressor trip', value: 41 },
  { label: 'Instrument fault', value: 14 },
  { label: 'Planned stop', value: 26 },
];

describe(ParetoChart.name, () => {
  it('names the chart with the label and the finding', () => {
    render(<ParetoChart label="Downtime by cause" rows={CAUSES} unit="h" />);

    expect(screen.getByRole('img', { name: /^Downtime by cause\. 3 of 4 causes account for 93 %/ })).toBeInTheDocument();
  });

  it('prints the generated finding under the chart', () => {
    render(<ParetoChart label="Downtime by cause" rows={CAUSES} />);

    expect(screen.getByText(/the largest is Compressor trip\.$/)).toBeInTheDocument();
  });

  it('uses a custom summary when given', () => {
    render(<ParetoChart label="Downtime by cause" rows={CAUSES} summary="Trips dominate." />);

    expect(screen.getByText('Trips dominate.')).toBeInTheDocument();
  });

  it('shows both axis units', () => {
    render(<ParetoChart label="Downtime by cause" rows={CAUSES} unit="h" />);

    expect(screen.getByText('h')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });
});

describe(paretoSummary.name, () => {
  it('counts the causes that reach the threshold', () => {
    expect(paretoSummary(CAUSES)).toBe('3 of 4 causes account for 93 % of the total; the largest is Compressor trip.');
  });

  it('respects another threshold', () => {
    expect(paretoSummary(CAUSES, 40)).toMatch(/^1 of 4 causes account for 47 %/);
  });

  it('handles no data', () => {
    expect(paretoSummary([])).toBe('No data.');
  });
});
