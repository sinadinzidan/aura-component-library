import { render, screen } from '@testing-library/react';

import { RangeIndicator } from './RangeIndicator';

const limits = { low: 10, high: 15 };

describe(RangeIndicator.name, () => {
  it('names the reading and its operating band', () => {
    render(<RangeIndicator label="Suction pressure" value={12.4} min={0} max={20} limits={limits} unit="barg" decimals={1} />);

    expect(screen.getByRole('img', { name: 'Suction pressure: 12.4\u00a0barg, operating band 10.0 to 15.0' })).toBeInTheDocument();
  });

  it('shades the band between low and high', () => {
    const { container } = render(<RangeIndicator label="Suction pressure" value={12.4} min={0} max={20} limits={limits} />);

    expect(container.querySelector('[data-slot="range-band"]')).toHaveStyle({ left: '50%', width: '25%' });
  });

  it('places the marker at the value', () => {
    const { container } = render(<RangeIndicator label="Suction pressure" value={12} min={0} max={20} limits={limits} />);

    expect(container.querySelector('[data-slot="range-marker"]')).toHaveStyle({ left: '60%' });
    expect(container.querySelector('[data-slot="range-marker"]')).toHaveClass('bg-chart-1-450');
  });

  it('turns warning outside the band', () => {
    const { container } = render(<RangeIndicator label="Suction pressure" value={16} min={0} max={20} limits={limits} />);

    expect(container.firstChild).toHaveAttribute('data-tone', 'warning');
    expect(container.querySelector('[data-slot="range-marker"]')).toHaveClass('bg-chart-warning-450');
  });

  it('prints the limit values unless hidden', () => {
    const { rerender } = render(<RangeIndicator label="Pressure" value={12} min={0} max={20} limits={limits} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    rerender(<RangeIndicator label="Pressure" value={12} min={0} max={20} limits={limits} showLimits={false} />);

    expect(screen.queryByText('15')).not.toBeInTheDocument();
  });

  it('has no marker without a value', () => {
    const { container } = render(<RangeIndicator label="Pressure" value={null} min={0} max={20} limits={limits} />);

    expect(container.querySelector('[data-slot="range-marker"]')).not.toBeInTheDocument();
  });
});
