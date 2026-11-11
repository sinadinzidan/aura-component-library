import { render, screen } from '@testing-library/react';

import { Pareto } from './Pareto';

const CAUSES = [
  { label: 'Instrument fault', value: 4 },
  { label: 'Compressor trip', value: 31 },
  { label: 'Power dip', value: 6 },
  { label: 'Cooler fouling', value: 9 },
];

describe(Pareto.name, () => {
  it('sorts the causes and prints value and running share', () => {
    const { container } = render(<Pareto label="Downtime by cause, March" items={CAUSES} unit="h" />);

    expect(screen.getByRole('img', { name: 'Downtime by cause, March' })).toBeInTheDocument();
    expect(screen.getByText('31 h')).toBeInTheDocument();
    expect(screen.getByText('62 %')).toBeInTheDocument();
    expect(screen.getByText('100 %')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-vital]')).toHaveLength(2);
  });

  it('names the threshold in the legend', () => {
    render(<Pareto label="Downtime" items={CAUSES} threshold={70} />);

    expect(screen.getByText('Vital few, first 70 %')).toBeInTheDocument();
    expect(screen.getByText('Running share')).toBeInTheDocument();
  });
});
