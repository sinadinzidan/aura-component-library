import { render, screen } from '@testing-library/react';

import { StepperSummary } from './StepperSummary';
import type { StepperSummaryStep } from './StepperSummary';

const STEPS: readonly StepperSummaryStep[] = [
  { label: 'Select data', state: 'complete' },
  { label: 'Schedule', state: 'current' },
  { label: 'Notifications', state: 'upcoming' },
  { label: 'Review', state: 'upcoming' },
];

describe(StepperSummary.name, () => {
  it('says which step people are on and what comes next', () => {
    render(<StepperSummary label="Create pipeline" steps={STEPS} />);

    expect(screen.getByRole('group', { name: 'Create pipeline' })).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.getByText('Schedule')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Next: Notifications')).toBeInTheDocument();
  });

  it('has no progress bar unless asked', () => {
    render(<StepperSummary label="Create pipeline" steps={STEPS} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('describes progress on the bar', () => {
    const { container } = render(<StepperSummary label="Create pipeline" steps={STEPS} bar />);

    const bar = screen.getByRole('progressbar', {
      name: 'Create pipeline progress',
    });
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuemax', '4');
    expect(bar).toHaveAttribute('aria-valuetext', 'Step 2 of 4: Schedule');
    expect(container.querySelectorAll('[data-slot="stepper-segment"]')).toHaveLength(4);
  });

  it('names the state of a step that needs attention', () => {
    render(<StepperSummary label="Create pipeline" steps={[STEPS[0], { label: 'Schedule', state: 'error' }, STEPS[2]]} />);

    expect(screen.getByText('(needs attention)')).toBeInTheDocument();
  });

  it('says when every step is done', () => {
    render(<StepperSummary label="Create pipeline" steps={STEPS.map((step) => ({ ...step, state: 'complete' as const }))} />);

    expect(screen.getByText('All 4 steps completed')).toBeInTheDocument();
    expect(screen.queryByText(/^Next:/)).not.toBeInTheDocument();
  });
});
