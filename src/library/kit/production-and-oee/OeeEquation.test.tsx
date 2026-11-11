import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { OeeEquation } from './OeeEquation';

const FACTORS = [
  { label: 'Availability', value: 90, target: 95, tone: 'teal' as const, detail: '31 h of stops' },
  { label: 'Performance', value: 95, tone: 'blue' as const },
  { label: 'Quality', value: 100, tone: 'purple' as const },
];

describe(OeeEquation.name, () => {
  it('shows every factor and the product computed from them', () => {
    render(<OeeEquation factors={FACTORS} resultTarget={85} />);

    expect(screen.getByRole('group', { name: 'OEE 85.5 %' })).toBeInTheDocument();
    expect(screen.getByText('Availability')).toBeInTheDocument();
    expect(screen.getByText(/Target 95.0 · 5.0 pts short/)).toBeInTheDocument();
    expect(screen.getByText(/31 h of stops/)).toBeInTheDocument();
    expect(screen.getByText(/Target 85.0 · 0.5 pts over/)).toBeInTheDocument();
  });

  it('uses tinted tiles by default and solid blocks in a block-built look', () => {
    const { rerender } = render(<OeeEquation factors={FACTORS} />);
    expect(screen.getByRole('group')).toHaveAttribute('data-anatomy', 'soft');

    rerender(
      <LookScope look="poster">
        <OeeEquation factors={FACTORS} />
      </LookScope>,
    );
    expect(screen.getByRole('group')).toHaveAttribute('data-anatomy', 'solid');
  });

  it('draws ruled columns in editorial', () => {
    render(
      <LookScope look="editorial">
        <OeeEquation factors={FACTORS} />
      </LookScope>,
    );
    expect(screen.getByRole('group')).toHaveAttribute('data-anatomy', 'line');
  });
});
