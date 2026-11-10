import { render, screen } from '@testing-library/react';

import { ArcReadout } from './ArcReadout';

describe(ArcReadout.name, () => {
  it('is a meter with its range, value and readable text', () => {
    render(<ArcReadout value={72} label="Health" unit="%" />);

    const meter = screen.getByRole('meter', { name: 'Health' });
    expect(meter).toHaveAttribute('aria-valuenow', '72');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(meter).toHaveAttribute('aria-valuetext', '72 %');
  });

  it('prints the value with its decimals and unit', () => {
    render(<ArcReadout value={6.8} label="Vibration" unit="mm/s" decimals={1} max={15} />);

    expect(screen.getByText('6.8')).toBeInTheDocument();
    expect(screen.getByText('mm/s')).toBeInTheDocument();
  });

  it('draws a value arc only when there is something to draw', () => {
    const { container, rerender } = render(<ArcReadout value={40} label="Load" />);
    expect(container.querySelector('[data-slot="arc-readout-value"]')).toBeInTheDocument();

    rerender(<ArcReadout value={0} label="Load" />);
    expect(container.querySelector('[data-slot="arc-readout-value"]')).not.toBeInTheDocument();
  });

  it('shows a dash and says no data without a value', () => {
    render(<ArcReadout value={null} label="Load" />);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Load' })).toHaveAttribute('aria-valuetext', 'No data');
  });
});
