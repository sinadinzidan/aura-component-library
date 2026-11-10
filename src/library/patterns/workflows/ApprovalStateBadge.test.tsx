import { render, screen } from '@testing-library/react';

import type { ApprovalState } from './approvalState';
import { ApprovalStateBadge } from './ApprovalStateBadge';

const STATES: readonly [ApprovalState, string][] = [
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['changes-requested', 'Changes requested'],
  ['expired', 'Expired'],
];

describe(ApprovalStateBadge.name, () => {
  it.each(STATES)('labels %s in words', (state, label) => {
    render(<ApprovalStateBadge state={state} />);

    expect(screen.getByText(label)).toHaveAttribute('data-state', state);
  });

  it('takes a custom label', () => {
    render(<ApprovalStateBadge state="pending" label="Awaiting you" />);

    expect(screen.getByText('Awaiting you')).toBeInTheDocument();
  });
});
