import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SetupChecklist } from './SetupChecklist';
import type { SetupStep } from './SetupChecklist';

const STEPS: SetupStep[] = [
  { id: 'source', title: 'Connect a data source', done: true, actionLabel: 'Connect source' },
  { id: 'assets', title: 'Map your asset hierarchy', description: 'Upload a CSV.', done: false, actionLabel: 'Map assets' },
  { id: 'invite', title: 'Invite your team', description: 'Add operators.', done: false, actionLabel: 'Invite people', hint: 'Optional' },
];

describe(SetupChecklist.name, () => {
  it('reports progress from the steps', () => {
    renderChecklist();

    expect(screen.getByText('1 of 3 done')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '1 of 3 done');
  });

  it('opens only the first unfinished step', () => {
    renderChecklist();

    const current = screen.getByText('Map your asset hierarchy').closest('li');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Upload a CSV.')).toBeInTheDocument();
    expect(screen.queryByText('Add operators.')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('says which steps are done without relying on the icon', () => {
    renderChecklist();

    const done = screen.getByText('Connect a data source').closest('li');
    expect(done ? within(done).getByText('Done:') : null).toBeInTheDocument();
  });

  it('starts the current step', async () => {
    const onStepAction = renderChecklist();

    await userEvent.click(screen.getByRole('button', { name: 'Map assets' }));

    expect(onStepAction).toHaveBeenCalledWith('assets');
  });

  it('shows the completion content when every step is done', () => {
    renderChecklist(STEPS.map((step) => ({ ...step, done: true })));

    expect(screen.getByText('Setup complete')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByText('3 of 3 done')).toBeInTheDocument();
  });
});

function renderChecklist(steps: SetupStep[] = STEPS) {
  const onStepAction = vi.fn();
  render(
    <SetupChecklist title="Set up Nordkapp" steps={steps} onStepAction={onStepAction} complete={<p>Setup complete</p>} />
  );
  return onStepAction;
}
