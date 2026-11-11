import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RevisionRail, type Revision } from './RevisionRail';

const REVISIONS: Revision[] = [
  { revision: 'D', date: '4 Feb 2026', author: 'Aisha Khan', note: 'Added lube oil flow transmitter.', approval: 'approved' },
  { revision: 'C', date: '18 Nov 2025', author: 'Aisha Khan', note: 'Seal gas filter duplexed.', approval: 'superseded' },
];

describe(RevisionRail.name, () => {
  it('lists revisions newest first with what changed and who issued them', () => {
    render(<RevisionRail label="Revisions of NK-23-PID-0103" revisions={REVISIONS} />);

    expect(screen.getByRole('list', { name: 'Revisions of NK-23-PID-0103' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('data-revision'))).toEqual(['D', 'C']);
    expect(screen.getByText('Added lube oil flow transmitter.')).toBeInTheDocument();
    expect(screen.getByText('Aisha Khan · 4 Feb 2026')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Superseded')).toBeInTheDocument();
  });

  it('reports the picked revision and marks the selected one', async () => {
    const onSelect = vi.fn();
    render(<RevisionRail label="Revisions" revisions={REVISIONS} selected="D" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /Revision D/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Revision C/ }));
    expect(onSelect).toHaveBeenCalledWith('C');
  });
});
