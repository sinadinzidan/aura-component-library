import { render, screen } from '@testing-library/react';

import { GasReading } from './GasReading';

describe(GasReading.name, () => {
  it('reads safe inside the window and says the window', () => {
    render(<GasReading gas="Oxygen" symbol="O₂" value={20.9} unit="%" limits={{ low: 19.5, high: 23.5 }} scaleMax={25} taken="13:40" />);

    expect(screen.getByRole('meter', { name: 'Oxygen reading' })).toHaveAttribute('aria-valuetext', '20.9 %, safe');
    expect(screen.getByText('Safe 19.5–23.5 % · 13:40')).toBeInTheDocument();
  });

  it('reads unsafe above a one-sided limit', () => {
    const { container } = render(<GasReading gas="Hydrogen sulphide" symbol="H₂S" value={12} unit="ppm" decimals={0} limits={{ high: 10 }} scaleMax={20} />);

    expect(container.firstElementChild).toHaveAttribute('data-tone', 'critical');
    expect(screen.getByText('Unsafe')).toBeInTheDocument();
  });
});
