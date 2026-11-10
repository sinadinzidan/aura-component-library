import { render, screen } from '@testing-library/react';

import { TrendChart } from './TrendChart';
import type { TrendSeries } from './TrendChart';

const HOUR = 3_600_000;
const START = Date.UTC(2026, 2, 12, 6, 0, 0);

const PRESSURE: TrendSeries = {
  key: 'pressure',
  label: 'Discharge pressure',
  points: [48.1, 48.4, 49.0, 48.6].map((v, index) => ({ t: START + index * HOUR, v })),
};

describe(TrendChart.name, () => {
  it('exposes the chart as an image named by its label', () => {
    render(<TrendChart label="Discharge pressure, last 4 hours" series={[PRESSURE]} />);

    expect(screen.getByRole('img', { name: 'Discharge pressure, last 4 hours' })).toBeInTheDocument();
  });

  it('prints the summary under the chart', () => {
    render(<TrendChart label="Discharge pressure" series={[PRESSURE]} summary="Stable around 48.6 barg." />);

    expect(screen.getByText('Stable around 48.6 barg.')).toBeInTheDocument();
  });

  it('prints the axis units above the plot', () => {
    render(<TrendChart label="Pressure and temperature" series={[PRESSURE]} unit="barg" rightUnit="°C" />);

    expect(screen.getByText('barg')).toBeInTheDocument();
    expect(screen.getByText('°C')).toBeInTheDocument();
  });

  it('applies the height to the plot wrapper', () => {
    const { container } = render(<TrendChart label="Discharge pressure" series={[PRESSURE]} heightClassName="h-72" />);

    expect(container.querySelector('[data-slot="chart"]')?.parentElement).toHaveClass('h-72');
  });

  it('lists every series in the legend when asked', () => {
    render(
      <TrendChart
        label="Pressures"
        legend
        series={[PRESSURE, { ...PRESSURE, key: 'suction', label: 'Suction pressure' }]}
        envelopes={[{ key: 'range', label: 'Hourly min to max', points: [{ t: START, low: 47, high: 50 }] }]}
      />
    );

    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(legend).toHaveTextContent('Discharge pressure');
    expect(legend).toHaveTextContent('Suction pressure');
    expect(legend).toHaveTextContent('Hourly min to max');
  });

  it('draws the state strip in proportion to the time window', () => {
    const { container } = render(
      <TrendChart
        label="Discharge pressure"
        series={[PRESSURE]}
        statesLabel="Run state"
        states={[
          { from: START, to: START + 3 * HOUR * 0.5, label: 'Running', tone: 'neutral' },
          { from: START + 1.5 * HOUR, to: START + 3 * HOUR, label: 'Tripped', tone: 'critical' },
        ]}
      />
    );

    const segments = container.querySelectorAll('[data-slot="trend-state"]');
    expect(segments).toHaveLength(2);
    expect(segments[0]).toHaveStyle({ left: '0%', width: '50%' });
    expect(segments[1]).toHaveStyle({ left: '50%', width: '50%' });
    expect(segments[1]).toHaveAttribute('data-tone', 'critical');
    expect(screen.getByRole('img', { name: /^Run state: Running from 06:00 to 07:30, Tripped/ })).toBeInTheDocument();
  });

  it('renders without series', () => {
    render(<TrendChart label="Bearing temperature: no data" series={[]} />);

    expect(screen.getByRole('img', { name: 'Bearing temperature: no data' })).toBeInTheDocument();
  });
});
