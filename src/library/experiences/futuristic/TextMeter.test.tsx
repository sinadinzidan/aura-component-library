import { render, screen } from '@testing-library/react';

import { TextMeter } from './TextMeter';

describe(TextMeter.name, () => {
  it('is a meter with range, value and readable text', () => {
    render(<TextMeter value={48.6} label="Discharge pressure" min={0} max={60} unit="barg" decimals={1} />);

    const meter = screen.getByRole('meter', { name: 'Discharge pressure' });
    expect(meter).toHaveAttribute('aria-valuenow', '48.6');
    expect(meter).toHaveAttribute('aria-valuemax', '60');
    expect(meter).toHaveAttribute('aria-valuetext', '48.6 barg');
  });

  it('splits the bar into a filled and an empty run of the full width', () => {
    const { container } = render(<TextMeter value={30} label="Level" width={10} />);

    expect(container.querySelector('[data-slot="text-meter-fill"]')).toHaveTextContent('███');
    expect(container.querySelector('[data-slot="text-meter-rest"]')?.textContent).toBe('░'.repeat(7));
  });

  it('puts the half-step cell in the filled run', () => {
    const { container } = render(<TextMeter value={36} label="Level" width={10} />);

    expect(container.querySelector('[data-slot="text-meter-fill"]')?.textContent).toBe('███▓');
  });

  it('is empty and says no data without a value', () => {
    const { container } = render(<TextMeter value={null} label="Level" width={4} />);

    expect(container.querySelector('[data-slot="text-meter-fill"]')?.textContent).toBe('');
    expect(screen.getByRole('meter', { name: 'Level' })).toHaveAttribute('aria-valuetext', 'No data');
  });
});
