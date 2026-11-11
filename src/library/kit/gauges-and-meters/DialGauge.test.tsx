import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { DialGauge } from './DialGauge';

describe(DialGauge.name, () => {
  it('is a meter that reads the value with its unit', () => {
    render(<DialGauge label="Discharge pressure" value={48.6} max={60} unit="barg" decimals={1} />);

    const meter = screen.getByRole('meter', { name: 'Discharge pressure' });
    expect(meter).toHaveAttribute('aria-valuenow', '48.6');
    expect(meter).toHaveAttribute('aria-valuetext', '48.6 barg');
    expect(screen.getByText('48.6')).toBeInTheDocument();
  });

  it('shows a dash and says no data when the value is missing', () => {
    render(<DialGauge label="Bearing temperature" value={null} max={120} unit="°C" />);

    expect(screen.getByRole('meter', { name: 'Bearing temperature' })).toHaveAttribute('aria-valuetext', 'No data');
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('labels the ticks when asked', () => {
    render(<DialGauge label="Shaft speed" value={9840} max={12000} ticks={5} />);

    expect(screen.getByText('3,000')).toBeInTheDocument();
    expect(screen.getByText('12,000')).toBeInTheDocument();
  });

  it('points with a needle on a blueprint', () => {
    render(
      <LookScope look="blueprint">
        <DialGauge label="Level" value={54} max={100} />
      </LookScope>
    );

    expect(screen.getByRole('meter', { name: 'Level' })).toHaveAttribute('data-variant', 'needle');
  });
});
