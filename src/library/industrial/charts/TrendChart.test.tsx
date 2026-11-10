import { render, screen } from '@testing-library/react';

import { TrendChart, axisScale, eventLabelPosition, softColor } from './TrendChart';
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

describe(axisScale.name, () => {
  it('pads the data and rounds to tidy ticks', () => {
    expect(axisScale([46.2, 51.4])).toEqual({ domain: [44, 52], ticks: [44, 46, 48, 50, 52] });
  });

  it('uses the explicit domain and keeps ticks inside it', () => {
    expect(axisScale([1, 2], [40, 56])).toEqual({ domain: [40, 56], ticks: [40, 45, 50, 55] });
  });

  it('uses explicit ticks when given', () => {
    expect(axisScale([], [0, 100], [0, 50, 100]).ticks).toEqual([0, 50, 100]);
  });

  it('copes with a flat series and with no data', () => {
    expect(axisScale([5, 5]).domain[0]).toBeLessThan(5);
    expect(axisScale([]).ticks.length).toBeGreaterThan(1);
  });
});

describe(softColor.name, () => {
  it('swaps the strong step of a chart token for a light one', () => {
    expect(softColor('var(--color-chart-2-450)')).toBe('var(--color-chart-2-100)');
    expect(softColor('var(--color-chart-2-450)', 200)).toBe('var(--color-chart-2-200)');
  });

  it('leaves other colours alone', () => {
    expect(softColor('var(--color-chart-neutral-300)')).toBe('var(--color-chart-neutral-300)');
  });
});

describe(eventLabelPosition.name, () => {
  it('centres the label above the line away from the edges', () => {
    expect(eventLabelPosition('Alarm raised', 50)).toBe('top');
  });

  it('tucks the label inside the plot near either edge', () => {
    expect(eventLabelPosition('Alarm raised', 97)).toBe('insideTopRight');
    expect(eventLabelPosition('Alarm raised', 3)).toBe('insideTopLeft');
  });

  it('lets short labels sit closer to the edge than long ones', () => {
    expect(eventLabelPosition('1', 97)).toBe('top');
    expect(eventLabelPosition('Work order started', 80)).toBe('insideTopRight');
  });
});
