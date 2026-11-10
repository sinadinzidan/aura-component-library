import { render, screen } from '@testing-library/react';

import { Sparkline } from './Sparkline';

const values = [46.2, 47.1, 48.9, 47.4, 48.6];

describe(Sparkline.name, () => {
  it('names what it shows, with the latest value and range', () => {
    render(<Sparkline values={values} label="Discharge pressure, last 24 hours" unit="barg" />);

    expect(
      screen.getByRole('img', { name: 'Discharge pressure, last 24 hours: latest 48.6\u00a0barg, range 46.2 to 48.9' })
    ).toBeInTheDocument();
  });

  it('draws a line and no area by default', () => {
    const { container } = render(<Sparkline values={values} label="Pressure" />);

    expect(container.querySelector('[data-slot="sparkline-line"]')).toHaveClass('stroke-chart-1-450');
    expect(container.querySelector('[data-slot="sparkline-area"]')).not.toBeInTheDocument();
  });

  it('adds a single area fill in the area variant', () => {
    const { container } = render(<Sparkline values={values} label="Pressure" variant="area" />);

    expect(container.querySelector('[data-slot="sparkline-area"]')).toHaveClass('fill-chart-1-100');
  });

  it('draws one bar per value in the bar variant', () => {
    const { container } = render(<Sparkline values={values} label="Alarms per hour" variant="bar" />);

    expect(container.querySelectorAll('[data-slot="sparkline-bar"]')).toHaveLength(values.length);
    expect(container.querySelector('[data-slot="sparkline-line"]')).not.toBeInTheDocument();
  });

  it('marks bars above the limit with the limit tone', () => {
    const { container } = render(<Sparkline values={[1, 5, 2]} label="Alarms per hour" variant="bar" limit={3} />);

    const over = container.querySelectorAll('[data-over="true"]');
    expect(over).toHaveLength(1);
    expect(over[0]).toHaveClass('fill-chart-warning-450');
  });

  it('uses the status ramp for a toned series', () => {
    const { container } = render(<Sparkline values={values} label="Vibration" tone="critical" />);

    expect(container.querySelector('[data-slot="sparkline-line"]')).toHaveClass('stroke-chart-critical-450');
  });

  it('shows the last-point marker, limit line and band only when asked', () => {
    const { container, rerender } = render(<Sparkline values={values} label="Pressure" />);
    expect(container.querySelector('[data-slot="sparkline-last"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="sparkline-limit"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-slot="sparkline-band"]')).not.toBeInTheDocument();

    rerender(<Sparkline values={values} label="Pressure" showLast limit={52} band={{ low: 40, high: 52 }} />);

    expect(container.querySelector('[data-slot="sparkline-last"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="sparkline-limit"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="sparkline-band"]')).toBeInTheDocument();
  });

  it('fills its container unless a width is given', () => {
    const { rerender } = render(<Sparkline values={values} label="Pressure" />);
    expect(screen.getByRole('img')).toHaveAttribute('width', '100%');

    rerender(<Sparkline values={values} label="Pressure" width={80} height={20} />);

    expect(screen.getByRole('img')).toHaveAttribute('width', '80');
    expect(screen.getByRole('img')).toHaveAttribute('height', '20');
  });

  it('says there is no data and draws a placeholder for an empty series', () => {
    const { container } = render(<Sparkline values={[]} label="Bearing temperature" />);

    expect(screen.getByRole('img', { name: 'Bearing temperature: no data' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="sparkline-empty"]')).toBeInTheDocument();
  });
});
