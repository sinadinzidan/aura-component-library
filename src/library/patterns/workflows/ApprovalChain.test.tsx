import { render, screen, within } from '@testing-library/react';

import { ApprovalChain } from './ApprovalChain';
import type { ApprovalStep } from './ApprovalChain';

const STEPS: readonly ApprovalStep[] = [
  { id: 'a', role: 'Discipline engineer', name: 'Aisha Khan', state: 'approved', at: '12 Mar, 10:05', note: 'Checked against the trip matrix.' },
  { id: 'b', role: 'Shift supervisor', name: 'Liv Wold', state: 'current' },
  { id: 'c', role: 'Plant manager', state: 'waiting' },
];

describe(ApprovalChain.name, () => {
  it('lists the approvers in order', () => {
    render(<ApprovalChain label="Approval chain for MOC-2231" steps={STEPS} />);

    const items = within(screen.getByRole('list', { name: 'Approval chain for MOC-2231' })).getAllByRole('listitem');

    expect(items.map((item) => item.getAttribute('data-state'))).toEqual(['approved', 'current', 'waiting']);
  });

  it('says each state in words, with the time when there is one', () => {
    render(<ApprovalChain label="Chain" steps={STEPS} />);

    expect(screen.getByText('Approved · 12 Mar, 10:05')).toBeInTheDocument();
    expect(screen.getByText('Deciding now')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
  });

  it('marks whose turn it is', () => {
    render(<ApprovalChain label="Chain" steps={STEPS} />);

    expect(screen.getByText('Liv Wold').closest('li')).toHaveAttribute('aria-current', 'step');
  });

  it('numbers the steps that have not been decided', () => {
    render(<ApprovalChain label="Chain" steps={STEPS} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('says when a role has nobody assigned', () => {
    render(<ApprovalChain label="Chain" steps={STEPS} />);

    expect(screen.getByText('Not assigned')).toBeInTheDocument();
  });

  it('shows a comment and the rejected and skipped states', () => {
    render(
      <ApprovalChain
        label="Chain"
        steps={[
          { id: 'a', role: 'Engineer', name: 'Aisha Khan', state: 'rejected', note: 'Limit is above the design temperature.' },
          { id: 'b', role: 'Supervisor', name: 'Liv Wold', state: 'skipped' },
        ]}
      />
    );

    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(screen.getByText('Skipped')).toBeInTheDocument();
    expect(screen.getByText('Limit is above the design temperature.')).toBeInTheDocument();
  });
});
