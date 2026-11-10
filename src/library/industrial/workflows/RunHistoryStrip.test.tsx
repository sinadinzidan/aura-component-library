import { render, screen } from '@testing-library/react';

import { RunHistoryStrip } from './RunHistoryStrip';
import type { RunHistoryRun } from './RunHistoryStrip';

const RUNS: readonly RunHistoryRun[] = [
  { id: '1', status: 'success' },
  { id: '2', status: 'failed' },
  { id: '3', status: 'skipped' },
  { id: '4', status: 'running' },
];

describe(RunHistoryStrip.name, () => {
  it('is one image named with the counts', () => {
    render(<RunHistoryStrip label="PI extractor, last 4 runs" runs={RUNS} />);
    expect(
      screen.getByRole('img', { name: 'PI extractor, last 4 runs: 1 of 4 runs succeeded, 1 failed, 1 skipped, 1 running' })
    ).toBeInTheDocument();
  });

  it('draws one square per run in order', () => {
    const { container } = render(<RunHistoryStrip label="Runs" runs={RUNS} />);
    const statuses = [...container.querySelectorAll('[data-slot="run"]')].map((node) => node.getAttribute('data-status'));
    expect(statuses).toEqual(['success', 'failed', 'skipped', 'running']);
  });

  it('marks failed and skipped runs with a glyph, not only colour', () => {
    const { container } = render(<RunHistoryStrip label="Runs" runs={RUNS} />);
    expect(container.querySelector('[data-status="failed"] svg')).not.toBeNull();
    expect(container.querySelector('[data-status="skipped"] svg')).not.toBeNull();
    expect(container.querySelector('[data-status="success"] svg')).toBeNull();
  });

  it('prints the counts when asked', () => {
    render(<RunHistoryStrip label="Runs" runs={RUNS.slice(0, 2)} showSummary />);
    expect(screen.getByText('1 of 2 runs succeeded, 1 failed')).toBeInTheDocument();
  });
});
