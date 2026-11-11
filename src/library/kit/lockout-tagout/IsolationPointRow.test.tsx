import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { IsolationPoint } from './isolation';
import { IsolationPointRow } from './IsolationPointRow';

const POINT: IsolationPoint = { id: 'p1', step: 2, tag: '23-XV-9130', name: 'Suction valve', energy: 'process', method: 'Close and lock', state: 'locked', lock: 'R-114' };

function renderRow(ui: React.ReactElement) {
  return render(<ol>{ui}</ol>);
}

describe(IsolationPointRow.name, () => {
  it('shows the tag, energy, method, state and lock', () => {
    renderRow(<IsolationPointRow point={POINT} />);

    const row = screen.getByRole('listitem');
    expect(row).toHaveAttribute('data-state', 'locked');
    expect(screen.getByText('Suction valve')).toBeInTheDocument();
    expect(screen.getByText('23-XV-9130')).toBeInTheDocument();
    expect(screen.getByText('Process pressure')).toBeInTheDocument();
    expect(screen.getByText('· Close and lock')).toBeInTheDocument();
    expect(screen.getByText('Locked and tagged')).toBeInTheDocument();
    expect(screen.getByText('Lock R-114')).toBeInTheDocument();
  });

  it('offers the next action and reports it', async () => {
    const onAdvance = vi.fn();
    renderRow(<IsolationPointRow point={POINT} onAdvance={onAdvance} />);

    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    expect(onAdvance).toHaveBeenCalledWith('p1');
  });

  it('has no action once verified and says when there is no lock', () => {
    renderRow(<IsolationPointRow point={{ ...POINT, state: 'verified' }} onAdvance={() => undefined} />);
    expect(screen.queryByRole('button')).toBeNull();

    renderRow(<IsolationPointRow point={{ ...POINT, state: 'planned', lock: undefined }} />);
    expect(screen.getByText('No lock yet')).toBeInTheDocument();
  });

  it('takes a custom action and marks the current row', () => {
    renderRow(<IsolationPointRow point={POINT} current action={<button type="button">Remove lock</button>} onAdvance={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Remove lock' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Verify' })).toBeNull();
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'step');
  });
});
