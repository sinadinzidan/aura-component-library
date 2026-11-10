import { render, screen } from '@testing-library/react';

import { PlanCard } from './PlanCard';

const FEATURES = [
  { id: 'series', label: '50,000 time series' },
  { id: 'sso', label: 'Single sign-on', included: false },
];

describe(PlanCard.name, () => {
  it('names the region after the plan', () => {
    render(<PlanCard name="Team" price="€ 1,200" features={FEATURES} />);

    expect(screen.getByRole('region', { name: 'Team plan' })).toBeInTheDocument();
  });

  it('shows price, period and note', () => {
    render(<PlanCard name="Team" price="€ 1,200" period="per month" priceNote="€ 14,400 billed yearly" features={FEATURES} />);

    expect(screen.getByText('€ 1,200')).toBeInTheDocument();
    expect(screen.getByText('per month')).toBeInTheDocument();
    expect(screen.getByText('€ 14,400 billed yearly')).toBeInTheDocument();
  });

  it('marks a highlighted plan with a written label', () => {
    render(<PlanCard name="Team" price="€ 1,200" features={FEATURES} highlightLabel="Recommended" />);

    expect(screen.getByText('Recommended')).toBeInTheDocument();
    expect(screen.getByRole('region')).toHaveAttribute('data-highlighted', 'true');
  });

  it('says which plan is the current one', () => {
    render(<PlanCard name="Starter" price="€ 400" features={FEATURES} current />);

    expect(screen.getByText('Current plan')).toBeInTheDocument();
  });

  it('announces features that are not included', () => {
    render(<PlanCard name="Team" price="€ 1,200" features={FEATURES} />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('data-included', 'true');
    expect(items[1]).toHaveTextContent('Not included: Single sign-on');
  });

  it('renders the action', () => {
    render(<PlanCard name="Team" price="€ 1,200" features={FEATURES} action={<button type="button">Choose Team</button>} />);

    expect(screen.getByRole('button', { name: 'Choose Team' })).toBeInTheDocument();
  });
});
