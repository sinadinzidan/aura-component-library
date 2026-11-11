import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Step } from './Step';
import { Stepper } from './Stepper';
import type { StepperProps } from './Stepper';

function renderStepper(props: Partial<StepperProps> = {}) {
  return render(
    <Stepper label="Create pipeline" current={1} {...props}>
      <Step label="Select data" />
      <Step label="Schedule" />
      <Step label="Notifications" />
      <Step label="Review" state={props.navigation === 'all' ? 'disabled' : undefined} />
    </Stepper>
  );
}

describe(Stepper.name, () => {
  it('is a named ordered list with one item per step', () => {
    renderStepper();

    const list = screen.getByRole('list', { name: 'Create pipeline' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
  });

  it('derives every step state from the current index', () => {
    renderStepper();

    expect(screen.getAllByRole('listitem').map((item) => item.getAttribute('data-state'))).toEqual([
      'complete',
      'current',
      'upcoming',
      'upcoming',
    ]);
  });

  it('marks exactly one step as the current step', () => {
    const { container } = renderStepper();

    const current = container.querySelectorAll('[aria-current="step"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Schedule');
  });

  it('has no buttons unless steps are navigable', () => {
    renderStepper();

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('makes visited steps buttons and leaves upcoming ones as text', () => {
    renderStepper({ onStepSelect: () => {} });

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: /Select data/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Notifications/ })).not.toBeInTheDocument();
  });

  it('puts aria-current on the button of a navigable current step', () => {
    renderStepper({ onStepSelect: () => {} });

    expect(screen.getByRole('button', { name: /Schedule/ })).toHaveAttribute('aria-current', 'step');
  });

  it('navigates back to a completed step', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: /Select data/ }));

    expect(screen.getByRole('button', { name: /Select data/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.queryByRole('button', { name: /Schedule/ })).not.toBeInTheDocument();
  });

  it('navigates from the keyboard', async () => {
    const onStepSelect = vi.fn();
    renderStepper({ onStepSelect });

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onStepSelect).toHaveBeenCalledWith(0);
  });

  it('lets every step but a disabled one be reached when navigation is all', () => {
    renderStepper({ onStepSelect: () => {}, navigation: 'all' });

    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /Review/ })).not.toBeInTheDocument();
  });

  it('renders one line for the compact variant', () => {
    renderStepper({ variant: 'compact' });

    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('adds a bar for the progress variant', () => {
    renderStepper({ variant: 'progress' });

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Step 2 of 4: Schedule');
  });

  it('renders both the row and the summary when it can collapse', () => {
    const { container } = renderStepper({ collapse: true });

    expect(container.querySelector('[data-slot="stepper"]')).toHaveClass('hidden');
    expect(container.querySelector('[data-slot="stepper-summary"]')).toBeInTheDocument();
  });

  it('exposes the orientation', () => {
    renderStepper({ orientation: 'vertical' });

    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'vertical');
  });
});

function Harness() {
  const [current, setCurrent] = useState(1);
  return (
    <Stepper label="Create pipeline" current={current} onStepSelect={setCurrent}>
      <Step label="Select data" />
      <Step label="Schedule" />
      <Step label="Review" />
    </Stepper>
  );
}
