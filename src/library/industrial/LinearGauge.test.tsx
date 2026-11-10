import { render, screen } from '@testing-library/react';

import { LinearGauge } from './LinearGauge';

const limits = { high: 95, highHigh: 105 };

describe(LinearGauge.name, () => {
  it('names the reading with value, unit and range', () => {
    render(<LinearGauge label="Motor current" value={86.2} max={120} unit="A" decimals={1} limits={limits} />);

    expect(screen.getByRole('img', { name: 'Motor current: 86.2\u00a0A, range 0.0 to 120.0' })).toBeInTheDocument();
  });

  it('fills the bar to the value’s share of the range', () => {
    const { container } = render(<LinearGauge label="Level" value={30} max={120} />);

    expect(container.querySelector('[data-slot="gauge-value"]')).toHaveStyle({ width: '25%' });
  });

  it('places warning and critical zones along the scale', () => {
    const { container } = render(<LinearGauge label="Motor current" value={86.2} max={120} limits={limits} />);

    const zones = container.querySelectorAll('[data-slot="gauge-zone"]');
    expect(zones).toHaveLength(2);
    expect(zones[0]).toHaveStyle({ left: '79.17%', width: '8.33%' });
    expect(zones[1]).toHaveAttribute('data-tone', 'critical');
  });

  it('takes the tone of the zone the value is in', () => {
    const { container } = render(<LinearGauge label="Motor current" value={96.4} max={120} decimals={1} limits={limits} />);

    expect(container.querySelector('[data-slot="gauge-value"]')).toHaveClass('bg-chart-warning-450');
    expect(screen.getByText('96.4')).toHaveClass('text-warning-foreground-strong');
  });

  it('places the target tick', () => {
    const { container } = render(<LinearGauge label="Availability" value={96.4} target={97.5} />);

    expect(container.querySelector('[data-slot="gauge-target"]')).toHaveStyle({ left: '97.5%' });
  });

  it('hides the header and shows the scale when asked', () => {
    render(<LinearGauge label="Motor current" value={86} max={120} showHeader={false} showScale />);

    expect(screen.queryByText('Motor current')).not.toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('draws an empty bar without a value', () => {
    const { container } = render(<LinearGauge label="Bearing temperature" value={null} max={120} />);

    expect(container.querySelector('[data-slot="gauge-value"]')).toHaveStyle({ width: '0%' });
    expect(screen.getByRole('img', { name: /no data/ })).toBeInTheDocument();
  });
});
