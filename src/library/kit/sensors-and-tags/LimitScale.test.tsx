import { render, screen } from '@testing-library/react';

import { LimitScale } from './LimitScale';

describe(LimitScale.name, () => {
  it('draws a zone per limit and names them on the ticks', () => {
    const { container } = render(<LimitScale label="Discharge pressure" value={48.6} min={0} max={60} unit="barg" limits={{ low: 40, high: 52, highHigh: 55 }} />);

    expect(container.querySelectorAll('[data-zone]')).toHaveLength(4);
    expect(screen.getByText('L 40.0')).toBeInTheDocument();
    expect(screen.getByText('H 52.0')).toBeInTheDocument();
    expect(screen.getByText('HH 55.0')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Discharge pressure' })).toHaveAttribute('aria-valuetext', '48.6 barg, normal');
  });

  it('takes the tone of the zone the value stands in and can show a flag and a setpoint', () => {
    const { container } = render(<LimitScale label="Vibration" value={7.6} min={0} max={15} unit="mm/s" limits={{ high: 7.1, highHigh: 11 }} setpoint={5} flag bare />);

    expect(container.firstElementChild).toHaveAttribute('data-tone', 'critical');
    expect(container.querySelector('[data-setpoint]')).not.toBeNull();
    expect(screen.getByText('7.6 mm/s')).toBeInTheDocument();
    expect(screen.queryByText('H 7.1')).toBeNull();
  });
});
