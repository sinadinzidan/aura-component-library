import { render, screen } from '@testing-library/react';

import { Meter } from './Meter';

describe(Meter.name, () => {
  it('exposes the value and range as a meter', () => {
    render(<Meter label="Discharge pressure" value={48.6} max={60} unit="barg" decimals={1} />);

    const meter = screen.getByRole('meter', { name: 'Discharge pressure' });
    expect(meter).toHaveAttribute('aria-valuenow', '48.6');
    expect(meter).toHaveAttribute('aria-valuemax', '60');
    expect(meter).toHaveAttribute('aria-valuetext', '48.6 barg');
  });

  it('fills the track in proportion to the value', () => {
    const { container } = render(<Meter label="Level" value={30} max={120} />);

    expect(container.querySelector<HTMLElement>('.kit-meter-fill')?.style.width).toBe('25%');
  });

  it('marks and names the target', () => {
    const { container } = render(<Meter label="Level" value={30} max={100} target={{ value: 70, label: 'High limit' }} />);

    expect(container.querySelector<HTMLElement>('.kit-meter-target')?.style.left).toBe('70%');
    expect(screen.getByText('High limit 70')).toBeInTheDocument();
  });

  it('shades the zones outside the limits', () => {
    const { container } = render(<Meter label="Level" value={50} max={100} low={30} high={70} />);

    expect(container.querySelectorAll('.kit-meter-zone')).toHaveLength(2);
  });

  it('clamps a value beyond the range', () => {
    const { container } = render(<Meter label="Level" value={150} max={100} hideScale />);

    expect(container.querySelector<HTMLElement>('.kit-meter-fill')?.style.width).toBe('100%');
    expect(container.querySelector('.kit-meter-scale')).toBeNull();
  });
});
