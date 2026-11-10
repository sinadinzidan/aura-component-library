import { render, screen } from '@testing-library/react';

import type { ReplaySignal } from './replayState';
import { ReplayTrend } from './ReplayTrend';

const MINUTE = 60_000;
const FROM = Date.UTC(2026, 2, 12, 13, 0, 0);
const TO = FROM + 30 * MINUTE;

const SIGNAL: ReplaySignal = {
  id: 'vibration',
  label: 'Vibration',
  tag: '23-VT-92740',
  unit: 'mm/s',
  decimals: 1,
  limits: { high: 7.1, highHigh: 11 },
  points: [
    { t: FROM, v: 4 },
    { t: FROM + 10 * MINUTE, v: 6 },
    { t: FROM + 20 * MINUTE, v: 8 },
    { t: TO, v: 12 },
  ],
};

function renderTrend(cursor: number) {
  return render(<ReplayTrend signal={SIGNAL} from={FROM} to={TO} cursor={cursor} domain={[0, 14]} eventTimes={[FROM + 20 * MINUTE]} />);
}

describe(ReplayTrend.name, () => {
  it('names the signal, its tag and its limits', () => {
    renderTrend(FROM);

    expect(screen.getByText('Vibration')).toBeInTheDocument();
    expect(screen.getByText('23-VT-92740')).toBeInTheDocument();
    expect(screen.getByText('HH 11 · H 7.1')).toBeInTheDocument();
  });

  it('draws the line only up to the cursor', () => {
    const { container } = renderTrend(FROM + 15 * MINUTE);

    expect(container.querySelector('[data-slot="replay-trend-line"]')).toHaveAttribute('d', expect.stringMatching(/^M 0 \S+ L 200 \S+ L 300 \S+$/));
    expect(container.querySelector('[data-slot="replay-trend-cursor"]')).toHaveAttribute('x1', '300');
  });

  it('shows a normal value quietly', () => {
    const { container } = renderTrend(FROM + 5 * MINUTE);

    expect(screen.getByText('5.0 mm/s')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="replay-trend"]')).toHaveAttribute('data-alarm', 'normal');
  });

  it('labels an alarm and a trip in words', () => {
    const { rerender } = renderTrend(FROM + 20 * MINUTE);
    expect(screen.getByText('Alarm')).toBeInTheDocument();

    rerender(<ReplayTrend signal={SIGNAL} from={FROM} to={TO} cursor={TO} domain={[0, 14]} />);
    expect(screen.getByText('Trip limit')).toBeInTheDocument();
  });

  it('draws one dashed line per limit and describes the chart', () => {
    const { container } = renderTrend(FROM + 20 * MINUTE);

    expect(container.querySelectorAll('[data-slot="replay-trend-limit"]')).toHaveLength(2);
    expect(screen.getByRole('img')).toHaveAccessibleName('Vibration up to the playhead: 8.0 mm/s, alarm');
  });
});
