import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TankGauge } from './TankGauge';

describe(TankGauge.name, () => {
  it('reports the level, the volume and the room left', () => {
    render(<TankGauge tag="27-TA-3001" product="Stabilised condensate" volume={3400} capacity={5000} />);

    const meter = screen.getByRole('meter', { name: 'Stabilised condensate, 27-TA-3001' });
    expect(meter).toHaveAttribute('aria-valuenow', '68');
    expect(meter).toHaveAttribute('aria-valuetext', '68 % full, normal');
    expect(screen.getByText('68 %')).toBeInTheDocument();
    expect(screen.getByText('3,400 of 5,000 m³')).toBeInTheDocument();
    expect(screen.getByText('Room for 1,600 m³')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('flags a high and a low level in words', () => {
    const { rerender } = render(<TankGauge tag="27-TA-3002" product="Condensate" volume={4410} capacity={5000} />);
    expect(screen.getByText('High level')).toBeInTheDocument();

    rerender(<TankGauge tag="62-TA-6205" product="Diesel" volume={21} capacity={250} />);
    expect(screen.getByText('Low level')).toBeInTheDocument();
  });

  it('shows no level for a tank out of service', () => {
    render(<TankGauge tag="27-TA-3003" product="Off-spec condensate" volume={0} capacity={1500} outOfService />);

    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Out of service');
    expect(screen.getByText('Capacity 1,500 m³')).toBeInTheDocument();
    expect(screen.queryByText(/Room for/)).toBeNull();
  });

  it('becomes a toggle when it can be selected', async () => {
    const onSelect = vi.fn();
    render(<TankGauge tag="62-TA-6201" product="Methanol" volume={184} capacity={400} selected onSelect={onSelect} />);

    const button = screen.getByRole('button', { pressed: true });
    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
