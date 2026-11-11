import { render, screen } from '@testing-library/react';

import { BlockGauge } from './BlockGauge';

describe(BlockGauge.name, () => {
  it('lights the share of blocks the value covers', () => {
    const { container } = render(<BlockGauge label="Discharge pressure" value={30} max={60} segments={20} unit="barg" />);

    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(10);
    expect(screen.getByRole('meter', { name: 'Discharge pressure' })).toHaveAttribute('aria-valuetext', '30 barg');
  });

  it('colours the blocks above the limits and takes the tone of the last lit block', () => {
    const { container } = render(<BlockGauge label="Vibration" value={12} max={15} segments={15} high={7} trip={11} />);

    expect(container.querySelectorAll('[data-tone="warning"][data-lit]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-tone="critical"][data-lit]')).toHaveLength(4);
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'critical');
  });

  it('stands up as a ladder', () => {
    const { container } = render(<BlockGauge label="Level" value={54} max={100} orientation="vertical" />);

    expect(container.firstElementChild).toHaveAttribute('data-orientation', 'vertical');
    expect(screen.getByText('Level')).toBeInTheDocument();
  });
});
