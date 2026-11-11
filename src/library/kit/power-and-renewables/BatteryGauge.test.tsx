import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { BatteryGauge } from './BatteryGauge';

describe(BatteryGauge.name, () => {
  it('says what the battery is doing and for how long', () => {
    render(<BatteryGauge label="Battery storage" charge={68} capacityMwh={20} powerMw={-5.2} reservePercent={20} />);

    expect(screen.getByRole('meter', { name: 'Battery storage' })).toHaveAttribute('aria-valuenow', '68');
    expect(screen.getByText('Discharging at 5.2 MW')).toBeInTheDocument();
    expect(screen.getByText('1 h 51 min to reserve')).toBeInTheDocument();
    expect(screen.getByText('Reserve 20 %')).toBeInTheDocument();
  });

  it('turns to warning at the reserve', () => {
    const { container } = render(<BatteryGauge label="Battery storage" charge={20} capacityMwh={20} powerMw={-1} reservePercent={20} />);

    expect(container.firstElementChild).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByText('At reserve')).toBeInTheDocument();
  });

  it('reports charging time', () => {
    render(<BatteryGauge label="Battery storage" charge={50} capacityMwh={20} powerMw={4} />);

    expect(screen.getByText('Full in 2 h 30 min')).toBeInTheDocument();
  });

  it('is a row of blocks in console', () => {
    const { container } = render(
      <LookScope look="console">
        <BatteryGauge label="Battery storage" charge={68} capacityMwh={20} powerMw={0} />
      </LookScope>
    );

    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(7);
    expect(screen.getByText('Holding charge')).toBeInTheDocument();
  });
});
