import { render, screen } from '@testing-library/react';

import { GapTimeline, type GapRow } from './GapTimeline';

const ROWS: GapRow[] = [
  { id: 'a', label: '23-PT-92531', sublabel: 'Discharge pressure', gaps: [] },
  { id: 'b', label: '40-TT-40015', gaps: [{ from: 50, to: 100 }, { from: 10, to: 20 }] },
];
const TICKS = [
  { at: 0, label: '14:00' },
  { at: 100, label: 'Now' },
];

describe(GapTimeline.name, () => {
  it('draws a row per series with its coverage', () => {
    render(<GapTimeline label="Gaps over the last 24 hours" rows={ROWS} start={0} end={100} ticks={TICKS} />);

    expect(screen.getByRole('img', { name: 'Gaps over the last 24 hours' })).toBeInTheDocument();
    expect(screen.getByText('23-PT-92531')).toBeInTheDocument();
    expect(screen.getByText('Discharge pressure')).toBeInTheDocument();
    expect(screen.getByText('100.0 %')).toBeInTheDocument();
    expect(screen.getByText('40.0 %')).toBeInTheDocument();
  });

  it('places each gap on the window', () => {
    const { container } = render(<GapTimeline label="Gaps" rows={ROWS} start={0} end={100} ticks={TICKS} />);

    const gaps = container.querySelectorAll<HTMLElement>('[data-gap]');
    expect(gaps).toHaveLength(2);
    expect(gaps[0].style.left).toBe('10.00%');
    expect(gaps[1].style.left).toBe('50.00%');
  });

  it('writes the time captions and explains the hatching', () => {
    render(<GapTimeline label="Gaps" rows={ROWS} start={0} end={100} ticks={TICKS} />);

    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.getByText('Now')).toBeInTheDocument();
    expect(screen.getByText('No data')).toBeInTheDocument();
  });
});
