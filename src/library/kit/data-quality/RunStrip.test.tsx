import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Run } from './quality';
import { RunStrip } from './RunStrip';

const RUNS: Run[] = [
  { id: 'r1', status: 'success', startedAt: 0, durationMs: 40_000 },
  { id: 'r2', status: 'failed', startedAt: 1, durationMs: 4_000 },
  { id: 'r3', status: 'running', startedAt: 2, durationMs: 0 },
];
const start = (timestamp: number): string => `run ${timestamp}`;

describe(RunStrip.name, () => {
  it('draws one mark per run in order', () => {
    const { container } = render(<RunStrip label="Last 3 runs of sap-work-orders" runs={RUNS} formatStart={start} />);

    expect(screen.getByRole('img', { name: 'Last 3 runs of sap-work-orders' })).toBeInTheDocument();
    const marks = [...container.querySelectorAll('[data-run]')].map((mark) => mark.getAttribute('data-run'));
    expect(marks).toEqual(['success', 'failed', 'running']);
  });

  it('scales bars by duration but keeps short runs visible', () => {
    const { container } = render(<RunStrip label="Runs" runs={RUNS} formatStart={start} />);

    const marks = container.querySelectorAll<HTMLElement>('[data-run]');
    expect(marks[0].style.height).toBe('100%');
    expect(marks[1].style.height).toBe('18%');
  });

  it('describes each run and reports the picked one', async () => {
    const onSelect = vi.fn();
    render(<RunStrip label="Runs" runs={RUNS} selected="r1" onSelect={onSelect} formatStart={start} />);

    expect(screen.getByRole('button', { name: 'run 0: succeeded, 40 s' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'run 1: failed, 4 s' }));
    expect(onSelect).toHaveBeenCalledWith('r2');
  });

  it('draws equal cells as blocks', () => {
    const { container } = render(<RunStrip label="Runs" runs={RUNS} variant="blocks" formatStart={start} />);

    const heights = [...container.querySelectorAll<HTMLElement>('[data-run]')].map((mark) => mark.style.height);
    expect(heights).toEqual(['100%', '100%', '100%']);
  });
});
