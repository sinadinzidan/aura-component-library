import { render, screen } from '@testing-library/react';

import { GapTimeline } from './GapTimeline';

const HOUR = 3_600_000;

describe(GapTimeline.name, () => {
  it('names coverage, gap count and missing time', () => {
    render(<GapTimeline label="23-PT-92531, last 10 hours" start={0} end={10 * HOUR} gaps={[{ from: 2 * HOUR, to: 3 * HOUR }, { from: 6 * HOUR, to: 7.5 * HOUR }]} />);
    expect(
      screen.getByRole('img', { name: '23-PT-92531, last 10 hours: 75% covered, 2 gaps, 2 h 30 min missing' })
    ).toBeInTheDocument();
  });

  it('draws one filled segment per stretch of data', () => {
    const { container } = render(<GapTimeline label="Series" start={0} end={100} gaps={[{ from: 20, to: 40 }]} />);
    const segments = [...container.querySelectorAll<HTMLElement>('[data-slot="gap-timeline-present"]')];
    expect(segments.map((segment) => [segment.style.left, segment.style.width])).toEqual([
      ['0%', '20%'],
      ['40%', '60%'],
    ]);
  });

  it('says when nothing is missing', () => {
    render(<GapTimeline label="Series" start={0} end={100} gaps={[]} showSummary />);
    expect(screen.getByText('100% covered, no gaps')).toBeInTheDocument();
  });

  it('shows the end captions', () => {
    render(<GapTimeline label="Series" start={0} end={100} gaps={[]} startLabel="11 Mar 14:00" endLabel="Now" />);
    expect(screen.getByText('11 Mar 14:00')).toBeInTheDocument();
    expect(screen.getByText('Now')).toBeInTheDocument();
  });
});
