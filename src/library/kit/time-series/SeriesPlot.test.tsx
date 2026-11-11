import { fireEvent, render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { SeriesPlot, type PlotSeries } from './SeriesPlot';

const LABELS = ['10:00', '11:00', '12:00', '13:00', '14:00'];

const PRESSURE: PlotSeries = { id: 'pressure', label: 'Discharge pressure', values: [46, 47, 48.5, 48, 48.6] };

describe(SeriesPlot.name, () => {
  it('names the chart and writes the latest value', () => {
    render(<SeriesPlot label="Discharge pressure, last 4 hours" series={[PRESSURE]} labels={LABELS} unit="barg" />);

    expect(screen.getByRole('img', { name: 'Discharge pressure, last 4 hours' })).toBeInTheDocument();
    expect(screen.getByText('48.6 barg')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  it('breaks the line at a gap', () => {
    const { container } = render(<SeriesPlot label="Level" series={[{ id: 'level', label: 'Level', values: [50, 51, null, 53, 54] }]} labels={LABELS} />);

    expect(container.querySelectorAll('[data-series="level"] [data-part="line"]')).toHaveLength(2);
  });

  it('draws limits, bands, regions, events and an envelope', () => {
    const { container } = render(
      <SeriesPlot
        label="Pressure"
        series={[{ ...PRESSURE, envelope: { min: [45, 46, 47, 47, 48], max: [47, 48, 49, 49, 50] } }]}
        labels={LABELS}
        limits={[{ value: 52, label: 'High 52.0' }]}
        bands={[{ from: 40, to: 52 }]}
        regions={[{ from: 1, to: 2, label: 'Signal lost' }]}
        events={[{ index: 3, label: 'Trip', tone: 'critical' }]}
      />,
    );

    expect(screen.getByText('High 52.0')).toBeInTheDocument();
    expect(screen.getByText('Signal lost')).toBeInTheDocument();
    expect(screen.getByText('Trip')).toBeInTheDocument();
    expect(container.querySelector('[data-part="band"]')).not.toBeNull();
    expect(container.querySelector('[data-part="envelope"]')).not.toBeNull();
    expect(container.querySelector('[data-part="event"]')).toHaveAttribute('data-tone', 'critical');
  });

  it('reads every series at the cursor and moves it with the arrow keys', () => {
    const onCursorChange = vi.fn();
    render(
      <SeriesPlot
        label="Pressure and speed"
        series={[PRESSURE, { id: 'speed', label: 'Shaft speed', values: [9800, 9810, null, 9830, 9840], axis: 'right' }]}
        labels={LABELS}
        unit="barg"
        rightUnit="rpm"
        rightDecimals={0}
        onCursorChange={onCursorChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole('group', { name: 'Pressure and speed' }), { key: 'ArrowRight' });
    expect(onCursorChange).toHaveBeenLastCalledWith(0);
    expect(screen.getByRole('status')).toHaveTextContent('10:00');
    expect(screen.getByRole('status')).toHaveTextContent('Shaft speed: 9,800 rpm');

    fireEvent.keyDown(screen.getByRole('group', { name: 'Pressure and speed' }), { key: 'ArrowRight' });
    fireEvent.keyDown(screen.getByRole('group', { name: 'Pressure and speed' }), { key: 'ArrowRight' });
    expect(screen.getByRole('status')).toHaveTextContent('Shaft speed: no data');

    fireEvent.keyDown(screen.getByRole('group', { name: 'Pressure and speed' }), { key: 'Escape' });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a controlled cursor', () => {
    render(<SeriesPlot label="Pressure" series={[PRESSURE]} labels={LABELS} unit="barg" cursor={2} />);

    expect(screen.getByRole('status')).toHaveTextContent('12:00');
    expect(screen.getByRole('status')).toHaveTextContent('Discharge pressure: 48.5 barg');
  });

  it('marks every point on a blueprint and leaves out the axes when bare', () => {
    const { container } = render(
      <LookScope look="blueprint">
        <SeriesPlot label="Pressure" series={[PRESSURE]} labels={LABELS} bare />
      </LookScope>,
    );

    expect(container.querySelectorAll('[data-part="point"]')).toHaveLength(5);
    expect(screen.queryByText('10:00')).not.toBeInTheDocument();
  });
});
