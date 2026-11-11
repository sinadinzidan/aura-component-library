import { fireEvent, render, screen } from '@testing-library/react';

import type { ReplayEvent, ReplaySignal } from '../../experiences/journeys/replayState';

import { ReplayEventLog } from './ReplayEventLog';
import { ReplayMiniTrend } from './ReplayMiniTrend';

const EVENTS: readonly ReplayEvent[] = [
  { id: 'a', t: 0, title: 'Normal operation', detail: 'All readings inside their bands.', tone: 'neutral' },
  { id: 'b', t: 10, title: 'First warning', detail: 'Oil pressure low.', tone: 'warning' },
  { id: 'c', t: 20, title: 'Trip', detail: 'High-high vibration.', tone: 'critical' },
];

const SIGNAL: ReplaySignal = {
  id: 'vibration',
  label: 'Drive-end vibration',
  tag: '23-VT-92740',
  unit: 'mm/s',
  decimals: 1,
  limits: { high: 7, highHigh: 11 },
  points: [
    { t: 0, v: 4 },
    { t: 10, v: 8 },
    { t: 20, v: 12 },
  ],
};

const formatTime = (t: number): string => `t${t}`;

describe(ReplayEventLog.name, () => {
  it('marks the current event and shows its detail only', () => {
    render(<ReplayEventLog events={EVENTS} eventIndex={1} formatTime={formatTime} />);

    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('First warning');
    expect(screen.getByText('Oil pressure low.')).toBeInTheDocument();
    expect(screen.queryByText('High-high vibration.')).toBeNull();
  });

  it('says "not yet" for events ahead of the playhead', () => {
    render(<ReplayEventLog events={EVENTS} eventIndex={0} formatTime={formatTime} />);

    expect(screen.getByText(/Trip · not yet/)).toBeInTheDocument();
    expect(screen.queryByText(/Normal operation · not yet/)).toBeNull();
  });

  it('marks nothing as current before the first event', () => {
    render(<ReplayEventLog events={EVENTS} eventIndex={-1} formatTime={formatTime} />);

    expect(screen.queryByRole('listitem', { current: 'step' })).toBeNull();
  });

  it('moves the playhead to an event when its row is clicked', () => {
    const onJump = vi.fn();
    render(<ReplayEventLog events={EVENTS} eventIndex={0} formatTime={formatTime} onJump={onJump} />);

    fireEvent.click(screen.getByRole('button', { name: 'Go to t20, Trip' }));

    expect(onJump).toHaveBeenCalledWith(20);
  });

  it('renders plain rows without buttons when there is no jump handler', () => {
    render(<ReplayEventLog events={EVENTS} eventIndex={0} formatTime={formatTime} />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe(ReplayMiniTrend.name, () => {
  const trend = (cursor: number) => <ReplayMiniTrend signal={SIGNAL} from={0} to={20} cursor={cursor} domain={[0, 13]} />;

  it('shows the value at the playhead with its unit', () => {
    render(trend(10));

    expect(screen.getByText(/8\.0\smm\/s/)).toBeInTheDocument();
  });

  it('names the state in words when a limit is passed', () => {
    const { container } = render(trend(10));

    expect(container.querySelector('figure')).toHaveAttribute('data-alarm', 'warning');
    expect(screen.getByText(/· alarm/)).toBeInTheDocument();
  });

  it('says trip limit at the trip and nothing extra when normal', () => {
    const { rerender } = render(trend(20));
    expect(screen.getByText(/· trip limit/)).toBeInTheDocument();

    rerender(trend(0));
    expect(screen.queryByText(/·/)).toBeNull();
  });

  it('draws the curve only up to the playhead and moves the cursor', () => {
    const { container, rerender } = render(trend(10));
    const cursor = () => container.querySelector('[data-slot="mini-trend-cursor"]')?.getAttribute('x1');
    const path = () => container.querySelector('path')?.getAttribute('d') ?? '';

    expect(cursor()).toBe('120');
    expect(path().match(/L/g)).toHaveLength(1);
    rerender(trend(20));
    expect(cursor()).toBe('240');
    expect(path().match(/L/g)).toHaveLength(2);
  });

  it('draws a dashed line for each limit and describes the chart', () => {
    const { container } = render(trend(10));

    expect(container.querySelectorAll('line[stroke-dasharray]')).toHaveLength(2);
    expect(screen.getByRole('img')).toHaveAccessibleName(/Drive-end vibration up to the playhead, now 8\.0.*alarm/);
  });

  it('draws no curve before the first sample', () => {
    const { container } = render(<ReplayMiniTrend signal={{ ...SIGNAL, points: [{ t: 5, v: 4 }] }} from={0} to={20} cursor={2} domain={[0, 13]} />);

    expect(container.querySelector('path')).toBeNull();
  });
});
