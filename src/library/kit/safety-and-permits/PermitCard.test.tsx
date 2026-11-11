import { render, screen } from '@testing-library/react';

import { PermitCard } from './PermitCard';

const VALIDITY = { from: '08:00', to: '18:00', elapsed: 0.6, remaining: '4 h left' };

describe(PermitCard.name, () => {
  it('shows the job, its state and how much of the validity has passed', () => {
    render(<PermitCard number="PTW-2291" title="Weld drain line" kind="Hot work" icon={<svg />} state="active" location="Module M20" holder="Tomás Barros" validity={VALIDITY} />);

    expect(screen.getByText('Weld drain line')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Validity of PTW-2291' })).toHaveAttribute('aria-valuenow', '60');
  });

  it('lists the tag, the controls and the reason for a suspension', () => {
    render(
      <PermitCard number="PTW-2288" title="Enter separator" kind="Confined space" icon={<svg />} state="suspended" location="M20" tag="20-VA-1002" holder="Jonas Nyberg" validity={VALIDITY} controls={['Gas test', 'Standby person']} reason="Gas retest overdue" />
    );

    expect(screen.getByText('Suspended')).toBeInTheDocument();
    expect(screen.getByText('Gas retest overdue')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Controls' }).children).toHaveLength(3);
  });
});
