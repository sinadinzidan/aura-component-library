import { render, screen } from '@testing-library/react';

import { GoldenProfile } from './GoldenProfile';

const PHASES = [
  { id: 'heat', label: 'Heat', start: 0, end: 40 },
  { id: 'react', label: 'React', start: 40, end: 100 },
];
const GOLDEN = [
  { t: 0, v: 20 },
  { t: 40, v: 80 },
  { t: 100, v: 80 },
];
const ACTUAL = [
  { t: 0, v: 21 },
  { t: 40, v: 79 },
  { t: 60, v: 85 },
];

describe(GoldenProfile.name, () => {
  it('names the chart, the phases and the tolerance', () => {
    render(<GoldenProfile label="Reactor temperature against the golden batch" golden={GOLDEN} actual={ACTUAL} phases={PHASES} tolerance={2} unit="°C" yDomain={[0, 100]} />);

    expect(screen.getByRole('img', { name: 'Reactor temperature against the golden batch' })).toBeInTheDocument();
    expect(screen.getByText('Heat')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Tolerance ± 2.0 °C')).toBeInTheDocument();
  });

  it('labels the latest value with the golden value at the same time', () => {
    render(<GoldenProfile label="Profile" golden={GOLDEN} actual={ACTUAL} phases={PHASES} tolerance={2} unit="°C" yDomain={[0, 100]} />);

    expect(screen.getByText('85.0 °C · golden 80.0')).toBeInTheDocument();
  });

  it('marks every excursion with its signed peak', () => {
    const { container } = render(
      <GoldenProfile label="Profile" golden={GOLDEN} actual={ACTUAL} phases={PHASES} tolerance={2} unit="°C" yDomain={[0, 100]} excursions={[{ from: 55, to: 60, phaseId: 'react', peak: 5 }]} showLegend={false} />
    );

    expect(container.querySelectorAll('[data-excursion]')).toHaveLength(1);
    expect(screen.getByText('+5.0 °C')).toBeInTheDocument();
    expect(screen.queryByText('Golden batch')).not.toBeInTheDocument();
  });
});
