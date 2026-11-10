import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Stepper } from './Stepper';
import type { StepperStep } from './Stepper';

const STEPS: StepperStep[] = [
  { id: 'source', label: 'Source' },
  { id: 'mapping', label: 'Mapping', description: 'Match columns to properties.' },
  { id: 'schedule', label: 'Schedule', optional: true },
  { id: 'review', label: 'Review' },
];

describe(Stepper.name, () => {
  it('lists every step in order under an accessible name', () => {
    render(<Stepper steps={STEPS} current={1} label="Pipeline setup" />);

    expect(screen.getByRole('list', { name: 'Pipeline setup' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('marks the current step for assistive tech', () => {
    render(<Stepper steps={STEPS} current={1} />);

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('says each state in words', () => {
    render(<Stepper steps={STEPS} current={1} />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Completed: Source');
    expect(items[1]).toHaveTextContent('Current: Mapping');
    expect(items[3]).toHaveTextContent('Not started: Review');
  });

  it('flags optional steps', () => {
    render(<Stepper steps={STEPS} current={0} />);

    expect(screen.getAllByRole('listitem')[2]).toHaveTextContent('Schedule (optional)');
  });

  it('shows descriptions in the vertical orientation only', () => {
    const { rerender } = render(<Stepper steps={STEPS} current={0} />);
    expect(screen.queryByText('Match columns to properties.')).not.toBeInTheDocument();

    rerender(<Stepper steps={STEPS} current={0} orientation="vertical" />);

    expect(screen.getByText('Match columns to properties.')).toBeInTheDocument();
  });

  it('marks a step that needs attention', () => {
    const steps = STEPS.map((step) => (step.id === 'source' ? { ...step, state: 'error' as const } : step));
    render(<Stepper steps={steps} current={2} />);

    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute('data-status', 'error');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Needs attention: Source');
  });

  it('has no buttons unless steps can be selected', () => {
    render(<Stepper steps={STEPS} current={2} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('lets the user jump back to a completed step', async () => {
    const onStepSelect = vi.fn();
    render(<Stepper steps={STEPS} current={2} onStepSelect={onStepSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Completed: Source' }));

    expect(onStepSelect).toHaveBeenCalledWith(0);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});
