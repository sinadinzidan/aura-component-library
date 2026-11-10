import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import type { StepperStep } from './Stepper';
import { WizardFrame } from './WizardFrame';

const STEPS: StepperStep[] = [
  { id: 'source', label: 'Source' },
  { id: 'schedule', label: 'Schedule', optional: true },
  { id: 'review', label: 'Review' },
];

describe(WizardFrame.name, () => {
  it('names the frame after the title and shows the step content', () => {
    renderFrame({});

    const frame = screen.getByRole('region', { name: 'Create pipeline' });
    expect(frame).toContainElement(screen.getByText('Step content'));
  });

  it('hides Back on the first step', () => {
    renderFrame({ current: 0 });

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });

  it('goes back and forward from the footer', async () => {
    const onBack = vi.fn();
    const onNext = vi.fn();
    renderFrame({ current: 1, onBack, onNext });

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('names the outcome on the last step and finishes', async () => {
    const onFinish = vi.fn();
    const onNext = vi.fn();
    renderFrame({ current: 2, onFinish, onNext, finishLabel: 'Create pipeline now' });

    await userEvent.click(screen.getByRole('button', { name: 'Create pipeline now' }));

    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('disables the primary action with a visible reason', () => {
    renderFrame({ blockedReason: 'Select a source to continue.' });

    const next = screen.getByRole('button', { name: 'Next' });
    expect(next).toBeDisabled();
    expect(next).toHaveAccessibleDescription('Select a source to continue.');
  });

  it('offers Skip on optional steps only', async () => {
    const onSkip = vi.fn();
    const { unmount } = renderFrame({ current: 0, onSkip });
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();
    unmount();

    renderFrame({ current: 1, onSkip });
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('shows a compact count instead of the stepper', () => {
    renderFrame({ current: 1, indicator: 'count' });

    expect(screen.getByText(/Step 2 of 3/)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows a progress bar with the count as its value text', () => {
    renderFrame({ current: 1, indicator: 'progress' });

    expect(screen.getByRole('progressbar', { name: 'Create pipeline progress' })).toHaveAttribute(
      'aria-valuetext',
      'Step 2 of 3'
    );
  });

  it('calls cancel from the footer', async () => {
    const onCancel = vi.fn();
    renderFrame({ onCancel });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

function renderFrame(overrides: Partial<ComponentProps<typeof WizardFrame>>) {
  return render(
    <WizardFrame title="Create pipeline" steps={STEPS} current={0} onBack={vi.fn()} onNext={vi.fn()} {...overrides}>
      <p>Step content</p>
    </WizardFrame>
  );
}
