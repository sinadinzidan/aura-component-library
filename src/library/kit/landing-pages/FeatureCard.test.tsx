import { render, screen } from '@testing-library/react';

import { FeatureCard } from './FeatureCard';

describe(FeatureCard.name, () => {
  it('names the feature, explains it and offers its action', () => {
    render(<FeatureCard title="Alarm rationalisation" body="Find the alarms that repeat." action={<button type="button">See how</button>} />);

    expect(screen.getByRole('region', { name: 'Alarm rationalisation' })).toBeInTheDocument();
    expect(screen.getByText('Find the alarms that repeat.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'See how' })).toBeInTheDocument();
  });

  it('shows the figure with its caption', () => {
    render(<FeatureCard title="Handover" body="Notes write themselves." figure={{ value: '12 min', caption: 'saved per shift' }} tone="teal" />);

    expect(screen.getByText('12 min')).toBeInTheDocument();
    expect(screen.getByText('saved per shift')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Handover' })).toHaveAttribute('data-tone', 'teal');
  });
});
