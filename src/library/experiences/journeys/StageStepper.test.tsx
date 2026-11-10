import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StageStepper } from './StageStepper';

describe(StageStepper.name, () => {
  it('shows the position, the stage name and a pip per stage', () => {
    const { container } = render(<StageStepper index={2} count={6} stageLabel="1st stage compression" onPrevious={vi.fn()} onNext={vi.fn()} />);

    expect(screen.getByText('Stage 3 of 6')).toBeInTheDocument();
    expect(screen.getByText(/1st stage compression/)).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="stepper-pip"]')).toHaveLength(6);
    expect(container.querySelectorAll('[data-state="passed"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-state="current"]')).toHaveLength(1);
  });

  it('calls the handlers', async () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(<StageStepper index={2} count={6} stageLabel="Cooling" onPrevious={onPrevious} onNext={onNext} />);

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('disables Previous at the start and says why', () => {
    render(<StageStepper index={0} count={6} stageLabel="Inlet" onPrevious={vi.fn()} onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    expect(screen.getByText(/start of route/)).toBeInTheDocument();
  });

  it('disables Next at the end and says why', () => {
    render(<StageStepper index={5} count={6} stageLabel="Export" onPrevious={vi.fn()} onNext={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByText(/end of route/)).toBeInTheDocument();
  });

  it('names the neighbouring stages on the buttons', () => {
    render(
      <StageStepper index={1} count={3} stageLabel="Separation" previousLabel="Inlet" nextLabel="Compression" noun="Step" onPrevious={vi.fn()} onNext={vi.fn()} />
    );

    expect(screen.getByRole('button', { name: 'Previous: Inlet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next: Compression' })).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
  });
});
