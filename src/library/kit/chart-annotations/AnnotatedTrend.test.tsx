import { fireEvent, render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { AnnotatedTrend, type AnnotatedSeries } from './AnnotatedTrend';

const LABELS = ['00:00', '01:00', '02:00', '03:00', '04:00'];
const SERIES: AnnotatedSeries[] = [{ id: 'p', label: 'Pressure', values: [10, 12, 14, 12, 11] }];

describe(AnnotatedTrend.name, () => {
  it('names the chart and labels its limits with their values', () => {
    render(<AnnotatedTrend label="Pressure over four hours" series={SERIES} labels={LABELS} unit="barg" limits={[{ value: 13, label: 'High' }]} />);

    expect(screen.getByRole('img', { name: 'Pressure over four hours' })).toBeInTheDocument();
    expect(screen.getByText('High 13.0')).toBeInTheDocument();
    expect(screen.getByText('barg')).toBeInTheDocument();
  });

  it('draws regions, point notes and the now line', () => {
    const { container } = render(
      <AnnotatedTrend
        label="Pressure"
        series={SERIES}
        labels={LABELS}
        nowAt={3}
        regions={[{ id: 'stop', from: 1, to: 2, label: 'Planned stop' }]}
        points={[{ id: 'peak', at: 2, text: 'Peak 14.0' }]}
      />
    );

    expect(container.querySelector('[data-region="stop"]')).toHaveTextContent('Planned stop');
    expect(container.querySelector('[data-point="peak"]')).toHaveTextContent('Peak 14.0');
    expect(screen.getByText('Now')).toBeInTheDocument();
  });

  it('turns events into buttons and reports the selected one', () => {
    const onSelectEvent = vi.fn();
    render(
      <AnnotatedTrend
        label="Pressure"
        series={SERIES}
        labels={LABELS}
        events={[
          { id: 'a', at: 1, mark: '1', title: 'Alarm raised' },
          { id: 'b', at: 3, mark: '2', title: 'Valve opened' },
        ]}
        selectedEventId="a"
        onSelectEvent={onSelectEvent}
      />
    );

    expect(screen.getByRole('button', { name: '1: Alarm raised' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '2: Valve opened' }));

    expect(onSelectEvent).toHaveBeenCalledWith('b');
  });

  it('shrinks events to ticks without buttons when asked', () => {
    const { container } = render(<AnnotatedTrend label="Pressure" series={SERIES} labels={LABELS} eventStyle="tick" events={[{ id: 'a', at: 1, mark: '1', title: 'Alarm' }]} />);

    expect(container.querySelector('[data-event="a"]')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('shows the values under the cursor and clears it when the pointer leaves', () => {
    const onCursor = vi.fn();
    const { container } = render(<AnnotatedTrend label="Pressure" series={SERIES} labels={LABELS} unit="barg" cursor={2} onCursor={onCursor} />);

    expect(container.querySelector('[data-cursor]')).toHaveTextContent('14.0 barg');
    const plot = container.querySelector('[data-plot]');
    if (plot) fireEvent.pointerLeave(plot);

    expect(onCursor).toHaveBeenCalledWith(null);
  });

  it('draws the selection and a legend for several series', () => {
    const { container } = render(
      <LookScope look="blueprint">
        <AnnotatedTrend
          label="Two pressures"
          series={[...SERIES, { id: 's', label: 'Suction', values: [4, 4, 5, 5, 4], tone: 'teal' }]}
          labels={LABELS}
          selection={{ from: 1, to: 3 }}
        />
      </LookScope>
    );

    expect(container.querySelector('[data-selection]')).toBeInTheDocument();
    expect(screen.getByText('Suction')).toBeInTheDocument();
  });
});
