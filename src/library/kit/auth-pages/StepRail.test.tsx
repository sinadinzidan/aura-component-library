import { render, screen, within } from '@testing-library/react';

import { StepRail } from './StepRail';

const STEPS = [
  { id: 'account', label: 'Account', detail: 'Name and password' },
  { id: 'role', label: 'Role' },
  { id: 'verify', label: 'Verify email' },
];

describe(StepRail.name, () => {
  it('marks earlier steps done, the current step current and the rest to do', () => {
    render(<StepRail label="Create your account" steps={STEPS} current={1} />);

    const items = within(screen.getByRole('list', { name: 'Create your account' })).getAllByRole('listitem');

    expect(items.map((item) => item.getAttribute('data-state'))).toEqual(['done', 'current', 'todo']);
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Name and password')).toBeInTheDocument();
  });

  it('numbers the steps that are not done', () => {
    render(<StepRail label="Steps" steps={STEPS} current={0} orientation="horizontal" />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
