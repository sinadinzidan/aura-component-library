import { render, screen } from '@testing-library/react';

import { RingGauge } from './RingGauge';

describe(RingGauge.name, () => {
  it('is a meter named by its label', () => {
    render(<RingGauge label="Gas compression" value={78} />);

    const gauge = screen.getByRole('meter', { name: 'Gas compression' });
    expect(gauge).toHaveAttribute('aria-valuenow', '78');
    expect(gauge).toHaveAttribute('aria-valuetext', '78 %');
  });

  it('draws an arc for the share of the range', () => {
    const { container } = render(<RingGauge label="Health" value={50} />);

    const [dash, total] = (container.querySelector('.kit-ring-value')?.getAttribute('stroke-dasharray') ?? '').split(' ').map(Number);
    expect(dash / total).toBeCloseTo(0.5, 2);
  });

  it('can hide the visible label and keep the name', () => {
    render(<RingGauge label="Health" value={50} hideLabel />);

    expect(screen.queryByText('Health')).toBeNull();
    expect(screen.getByRole('meter', { name: 'Health' })).toBeInTheDocument();
  });

  it('sets its diameter in px by default', () => {
    render(<RingGauge label="Health" value={50} size={64} />);

    expect(screen.getByRole('meter', { name: 'Health' }).style.getPropertyValue('--kit-ring-size')).toBe('64px');
  });

  it('can fill its container instead', () => {
    render(<RingGauge label="Health" value={50} size="fill" />);

    const gauge = screen.getByRole('meter', { name: 'Health' });
    expect(gauge).toHaveAttribute('data-fill', 'true');
    expect(gauge.style.getPropertyValue('--kit-ring-size')).toBe('');
  });
});
