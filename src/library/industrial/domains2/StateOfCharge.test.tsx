import { render, screen } from '@testing-library/react';

import { StateOfCharge } from './StateOfCharge';

describe(StateOfCharge.name, () => {
  it('says the battery is charging, at what power and for how long', () => {
    render(<StateOfCharge label="BESS-01" charge={60} capacity={40} power={8} />);

    expect(screen.getByRole('img')).toHaveAccessibleName('BESS-01: 60 % charged, charging at 8.0 MW');
    expect(screen.getByText('Charging')).toBeInTheDocument();
    expect(screen.getByText('Full in 2 h')).toBeInTheDocument();
  });

  it('counts a discharge down to the reserve', () => {
    render(<StateOfCharge label="BESS-01" charge={60} capacity={40} power={-10} reserve={10} />);

    expect(screen.getByText('Discharging')).toBeInTheDocument();
    expect(screen.getByText('Reserve in 2 h')).toBeInTheDocument();
  });

  it('shows the energy stored against capacity', () => {
    render(<StateOfCharge label="BESS-01" charge={60} capacity={40} power={8} reserve={10} />);

    expect(screen.getByText('24.0 of 40 MWh · reserve 10 %')).toBeInTheDocument();
  });

  it('is idle without power', () => {
    const { container } = render(<StateOfCharge label="BESS-01" charge={60} capacity={40} power={0} />);

    expect(container.querySelector('[data-slot="state-of-charge"]')).toHaveAttribute('data-mode', 'idle');
    expect(screen.getByText('Idle')).toBeInTheDocument();
    expect(screen.queryByText(/in \d/)).not.toBeInTheDocument();
  });

  it('warns in words at the reserve', () => {
    const { container } = render(<StateOfCharge label="BESS-01" charge={9} capacity={40} power={-4} reserve={10} />);

    expect(container.querySelector('[data-slot="state-of-charge"]')).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByText('At reserve')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAccessibleName('BESS-01: 9 % charged, discharging at 4.0 MW, at or below reserve');
  });

  it('sizes the fill and places the reserve tick', () => {
    const { container } = render(<StateOfCharge label="BESS-01" charge={60} capacity={40} power={8} reserve={10} />);

    expect(container.querySelector<HTMLElement>('[data-slot="charge-fill"]')?.style.width).toBe('60%');
    expect(container.querySelector<HTMLElement>('[data-slot="charge-reserve"]')?.style.left).toBe('10%');
  });

  it('clamps a charge outside 0 to 100', () => {
    const { container } = render(<StateOfCharge label="BESS-01" charge={104} capacity={40} power={0} />);

    expect(container.querySelector<HTMLElement>('[data-slot="charge-fill"]')?.style.width).toBe('100%');
  });
});
