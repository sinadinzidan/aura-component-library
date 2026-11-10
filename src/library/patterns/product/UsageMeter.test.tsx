import { render, screen } from '@testing-library/react';

import { UsageMeter } from './UsageMeter';

describe(UsageMeter.name, () => {
  it('states usage and limit in words on the meter', () => {
    render(<UsageMeter label="API requests" used={412_000} limit={1_000_000} />);

    const meter = screen.getByRole('meter', { name: 'API requests' });
    expect(meter).toHaveAttribute('aria-valuenow', '412000');
    expect(meter).toHaveAttribute('aria-valuetext', '412\u00a0k of 1\u00a0M, 41%');
    expect(screen.getByText('41%')).toBeInTheDocument();
  });

  it('stays without a state label while usage is normal', () => {
    const { container } = render(<UsageMeter label="Storage" used={120} limit={500} unit="GB" />);

    expect(container.querySelector('[data-slot="usage-state"]')).toBeNull();
    expect(container.querySelector('[data-slot="usage-meter"]')).toHaveAttribute('data-level', 'normal');
  });

  it('writes out that usage is near the limit', () => {
    render(<UsageMeter label="Time series" used={46_100} limit={50_000} />);

    expect(screen.getByText('Near limit')).toBeInTheDocument();
  });

  it('writes out that the limit is reached and fills the bar', () => {
    const { container } = render(<UsageMeter label="Seats" used={25} limit={25} unit="seats" />);

    expect(screen.getByText('Limit reached')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="usage-fill"]')).toHaveStyle({ width: '100%' });
  });

  it('writes out usage over the limit', () => {
    render(<UsageMeter label="Storage" used={540} limit={500} unit="GB" />);

    expect(screen.getByText('Over limit')).toBeInTheDocument();
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '540 of 500\u00a0GB, 108%, over limit');
  });

  it('uses a custom formatter and shows the hint', () => {
    render(
      <UsageMeter label="Storage" used={120.5} limit={500} unit="GB" format={(value) => value.toFixed(1)} hint="Resets 1 April" layout="row" />
    );

    expect(screen.getByText('120.5 of 500.0\u00a0GB')).toBeInTheDocument();
    expect(screen.getByText('Resets 1 April')).toBeInTheDocument();
  });
});
