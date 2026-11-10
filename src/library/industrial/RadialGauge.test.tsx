import { render, screen } from '@testing-library/react';

import { RadialGauge } from './RadialGauge';

const limits = { low: 40, high: 52, highHigh: 55 };

describe(RadialGauge.name, () => {
  it('names the reading with value, unit and range', () => {
    render(<RadialGauge label="Discharge pressure" value={48.6} max={60} unit="barg" decimals={1} limits={limits} />);

    expect(screen.getByRole('img', { name: 'Discharge pressure: 48.6\u00a0barg, range 0.0 to 60.0' })).toBeInTheDocument();
  });

  it('prints value, unit, range ends and label', () => {
    render(<RadialGauge label="Discharge pressure" value={48.6} max={60} unit="barg" decimals={1} />);

    expect(screen.getByText('48.6')).toBeInTheDocument();
    expect(screen.getByText('barg')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('Discharge pressure')).toBeInTheDocument();
  });

  it('keeps the value arc in the data colour inside the limits', () => {
    const { container } = render(<RadialGauge label="Pressure" value={48.6} max={60} limits={limits} />);

    expect(container.querySelector('[data-slot="gauge-value"]')).toHaveClass('stroke-chart-1-450');
  });

  it('turns the arc and readout warning above the high limit', () => {
    const { container } = render(<RadialGauge label="Pressure" value={53} max={60} limits={limits} />);

    expect(container.querySelector('[data-slot="gauge-value"]')).toHaveClass('stroke-chart-warning-450');
    expect(screen.getByText('53')).toHaveClass('text-warning-foreground-strong');
    expect(screen.getByRole('img', { name: /warning/ })).toBeInTheDocument();
  });

  it('turns critical at the trip limit', () => {
    const { container } = render(<RadialGauge label="Pressure" value={56} max={60} limits={limits} />);

    expect(container.firstChild).toHaveAttribute('data-tone', 'critical');
  });

  it('draws only the warning and critical zones', () => {
    const { container } = render(<RadialGauge label="Pressure" value={48} max={60} limits={limits} />);

    const tones = [...container.querySelectorAll('[data-slot="gauge-zone"]')].map((zone) => zone.getAttribute('data-tone'));
    expect(tones).toEqual(['warning', 'warning', 'critical']);
  });

  it('draws a target tick when given a target', () => {
    const { container } = render(<RadialGauge label="Speed" value={9840} max={12000} target={10000} />);

    expect(container.querySelector('[data-slot="gauge-target"]')).toBeInTheDocument();
  });

  it('draws an empty gauge and says no data without a value', () => {
    const { container } = render(<RadialGauge label="Bearing temperature" value={null} max={120} unit="°C" />);

    expect(screen.getByRole('img', { name: /^Bearing temperature: no data/ })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="gauge-value"]')).not.toBeInTheDocument();
    expect(screen.getByText('\u2014')).toBeInTheDocument();
  });

  it('hides range and label when asked', () => {
    render(<RadialGauge label="Pressure" value={10} max={60} showRange={false} showLabel={false} />);

    expect(screen.queryByText('60')).not.toBeInTheDocument();
    expect(screen.queryByText('Pressure')).not.toBeInTheDocument();
  });
});
