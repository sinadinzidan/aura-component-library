import { render, screen } from '@testing-library/react';

import { PriceCard } from './PriceCard';

const FEATURES = [
  { label: 'Alarms and trends', included: true },
  { label: 'Agents', included: false },
];

describe(PriceCard.name, () => {
  it('shows the plan, its price and what is included', () => {
    render(
      <PriceCard name="Plant" description="For one site." price="€ 1 900" period="per site, per month" features={FEATURES} action={<button type="button">Start a trial</button>} />,
    );

    const plan = screen.getByRole('region', { name: 'Plant plan' });
    expect(plan).toHaveTextContent('€ 1 900');
    expect(plan).toHaveTextContent('per site, per month');
    expect(screen.getByText('Alarms and trends').textContent).toContain('(included)');
    expect(screen.getByText('Agents').textContent).toContain('(not included)');
    expect(screen.getByRole('button', { name: 'Start a trial' })).toBeInTheDocument();
  });

  it('labels the featured plan in words', () => {
    render(<PriceCard name="Plant" description="For one site." price="€ 1 900" features={FEATURES} action={null} featured featuredLabel="Recommended" />);

    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Plant plan' })).toHaveAttribute('data-featured');
  });
});
