import { render, screen } from '@testing-library/react';

import { Step } from './Step';
import { StepPositionContext, StepperContext } from './stepperContext';
import type { StepperContextValue } from './stepperContext';

const BASE: StepperContextValue = {
  orientation: 'vertical',
  size: 'md',
  markers: 'number',
  connector: 'solid',
  labelPlacement: 'inline',
  current: 1,
  navigation: 'visited',
  onStepSelect: undefined,
};

function renderStep(step: React.ReactNode, { index = 1, context = BASE }: { index?: number; context?: StepperContextValue } = {}) {
  return render(
    <ol>
      <StepperContext.Provider value={context}>
        <StepPositionContext.Provider value={{ index, count: 3 }}>{step}</StepPositionContext.Provider>
      </StepperContext.Provider>
    </ol>
  );
}

describe(Step.name, () => {
  it('derives its state from its position', () => {
    renderStep(<Step label="Schedule" />, { index: 0 });

    expect(screen.getByRole('listitem')).toHaveAttribute('data-state', 'complete');
    expect(screen.getByText('Completed:', { exact: false })).toHaveClass('sr-only');
  });

  it('marks the current step', () => {
    renderStep(<Step label="Schedule" />);

    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'step');
  });

  it('shows its number in the marker while not complete', () => {
    const { container } = renderStep(<Step label="Schedule" />, { index: 2 });

    expect(container.querySelector('[data-slot="step-marker"]')).toHaveTextContent('3');
  });

  it('lets an explicit state override the position', () => {
    renderStep(<Step label="Validate" state="error" />, { index: 0 });

    expect(screen.getByRole('listitem')).toHaveAttribute('data-state', 'error');
    expect(screen.getByText('Needs attention:', { exact: false })).toBeInTheDocument();
  });

  it('shows the description, the optional hint and trailing meta', () => {
    renderStep(<Step label="Notify" description="Email the shift supervisor" optional meta="09:40" />);

    expect(screen.getByText('Email the shift supervisor')).toBeInTheDocument();
    expect(screen.getByText('(optional)', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('09:40')).toBeInTheDocument();
  });

  it('renders content under a vertical step', () => {
    renderStep(<Step label="Schedule">Pick a start time</Step>);

    expect(screen.getByText('Pick a start time')).toBeInTheDocument();
  });

  it('draws no connector after the last step', () => {
    const { container } = renderStep(<Step label="Review" />, { index: 2 });

    expect(container.querySelector('[data-slot="step-connector"]')).not.toBeInTheDocument();
  });

  it('dashes the connector for the part still ahead', () => {
    const { container } = renderStep(<Step label="Schedule" />, {
      context: { ...BASE, connector: 'dashed' },
    });

    expect(container.querySelector('[data-slot="step-connector"]')).toHaveClass('border-dashed');
  });

  it('uses the step icon in icon markers', () => {
    renderStep(<Step label="Schedule" icon={<svg data-testid="clock" />} />, {
      context: { ...BASE, markers: 'icon' },
    });

    expect(screen.getByTestId('clock')).toBeInTheDocument();
  });
});
