import { render, screen } from '@testing-library/react';

import { ScoreStrip } from './ScoreStrip';

const SCORES = [0.1, 0.3, 0.8, 0.9, 0.2, 0.75].map((score, t) => ({ t, score }));

describe(ScoreStrip.name, () => {
  it('draws one cell per sample and flags those at or above the threshold', () => {
    const { container } = render(<ScoreStrip label="Anomaly score" scores={SCORES} threshold={0.7} />);

    const cells = container.querySelectorAll('[data-slot="score-cell"]');
    expect(cells).toHaveLength(6);
    expect(container.querySelectorAll('[data-flagged="true"]')).toHaveLength(3);
    expect(cells[2]).toHaveClass('bg-chart-warning-450');
    expect(cells[0]).toHaveClass('bg-chart-neutral-100');
  });

  it('darkens unflagged cells as the score nears the threshold', () => {
    const { container } = render(<ScoreStrip label="Anomaly score" scores={[0.1, 0.4, 0.65].map((score, t) => ({ t, score }))} threshold={0.7} />);

    const cells = container.querySelectorAll('[data-slot="score-cell"]');
    expect(cells[0]).toHaveClass('bg-chart-neutral-100');
    expect(cells[1]).toHaveClass('bg-chart-neutral-200');
    expect(cells[2]).toHaveClass('bg-chart-neutral-300');
  });

  it('says how many samples and periods are flagged in its name', () => {
    render(<ScoreStrip label="Anomaly score" scores={SCORES} threshold={0.7} />);

    expect(screen.getByRole('img', { name: 'Anomaly score: 3 of 6 samples flagged in 1 period' })).toBeInTheDocument();
  });

  it('names the flagged periods when given a time formatter', () => {
    render(<ScoreStrip label="Anomaly score" scores={SCORES} threshold={0.85} formatTime={(t) => `T${t}`} />);

    expect(screen.getByRole('img', { name: 'Anomaly score: 1 of 6 samples flagged in 1 period: T3 to T3' })).toBeInTheDocument();
  });

  it('says so when nothing is flagged', () => {
    render(<ScoreStrip label="Anomaly score" scores={SCORES} threshold={0.95} />);

    expect(screen.getByRole('img', { name: 'Anomaly score: no samples flagged' })).toBeInTheDocument();
    expect(screen.getByText('No samples flagged')).toBeInTheDocument();
  });

  it('prints the threshold and count in the caption, which can be hidden', () => {
    const { rerender } = render(<ScoreStrip label="Anomaly score" scores={SCORES} threshold={0.7} />);
    expect(screen.getByText('Score at or above 0.70')).toBeInTheDocument();
    expect(screen.getByText('3 of 6 samples flagged')).toBeInTheDocument();

    rerender(<ScoreStrip label="Anomaly score" scores={SCORES} threshold={0.7} showCaption={false} />);
    expect(screen.queryByText('Score at or above 0.70')).not.toBeInTheDocument();
  });

  it('insets the strip to line up with a chart', () => {
    const { container } = render(<ScoreStrip label="Anomaly score" scores={SCORES} threshold={0.7} insetLeft={44} insetRight={12} />);

    expect(container.querySelector('[data-slot="score-strip"]')).toHaveStyle({ paddingLeft: '44px', paddingRight: '12px' });
  });
});
