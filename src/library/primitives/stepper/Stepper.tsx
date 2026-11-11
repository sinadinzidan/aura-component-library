import { Children, isValidElement, useMemo } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import type { StepProps } from './Step';
import { StepPositionContext, StepperContext } from './stepperContext';
import type { StepperConnector, StepperLabelPlacement, StepperMarkers, StepperOrientation, StepperSize } from './stepperContext';
import { StepperSummary } from './StepperSummary';
import { resolveStepState } from './stepState';
import type { StepNavigation } from './stepState';

export type StepperProps = {
  /** Accessible name: what the steps are for, such as "Create data set". */
  label: string;
  /** Index of the step people are on. Steps before it are complete. Leave out when every `Step` sets its own `state`. */
  current?: number;
  orientation?: StepperOrientation;
  /** Marker size: 20, 24 or 28 px. */
  size?: StepperSize;
  /** `number` for a wizard, `dot` for a quiet status flow, `icon` when each step has a recognisable icon. */
  markers?: StepperMarkers;
  /** `dashed` draws the part still ahead as a dashed line; `none` drops the lines. */
  connector?: StepperConnector;
  /** Horizontal only: labels beside the markers, or below them when labels are long or carry a description. */
  labelPlacement?: StepperLabelPlacement;
  /** `compact` is one line, "Step 2 of 4"; `progress` adds a segmented bar. */
  variant?: 'steps' | 'compact' | 'progress';
  /** Shows the compact summary instead of the row when the stepper's container is narrow. */
  collapse?: boolean;
  /** Makes steps buttons that call this with the step's index. */
  onStepSelect?: (index: number) => void;
  /** Which steps can be jumped to: those already reached, or all of them. */
  navigation?: StepNavigation;
  className?: string;
  /** `Step` elements, in order. */
  children: ReactNode;
};

/**
 * Progress through a fixed sequence: a wizard, a start-up sequence, an order on its way. Shows
 * where people are, what is done and what is left; each `Step` reads as complete, current,
 * upcoming, failed, warned, skipped or unavailable in shape and words, not only colour.
 */
export function Stepper({
  label,
  current,
  orientation = 'horizontal',
  size = 'md',
  markers = 'number',
  connector = 'solid',
  labelPlacement = 'inline',
  variant = 'steps',
  collapse = false,
  onStepSelect,
  navigation = 'visited',
  className,
  children,
}: StepperProps) {
  const steps = Children.toArray(children).filter((child) => isValidElement<StepProps>(child));
  const context = useMemo(
    () => ({ orientation, size, markers, connector, labelPlacement, current, navigation, onStepSelect }),
    [orientation, size, markers, connector, labelPlacement, current, navigation, onStepSelect]
  );
  const summarySteps = steps.map((step, index) => ({
    label: step.props.label,
    state: resolveStepState(index, current, step.props.state),
  }));

  if (variant !== 'steps') {
    return <StepperSummary label={label} steps={summarySteps} bar={variant === 'progress'} className={className} />;
  }

  const list = (
    <ol
      aria-label={label}
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(
        'w-full min-w-0 list-none',
        orientation === 'vertical' ? 'flex-col' : labelPlacement === 'below' ? 'items-start' : 'items-center gap-3',
        collapse ? 'hidden @md:flex' : 'flex',
        !collapse && className
      )}
    >
      <StepperContext.Provider value={context}>
        {steps.map((step, index) => (
          <StepPositionContext.Provider key={step.key ?? index} value={{ index, count: steps.length }}>
            {step}
          </StepPositionContext.Provider>
        ))}
      </StepperContext.Provider>
    </ol>
  );

  if (!collapse) return list;

  return (
    <div data-slot="stepper-collapse" className={cn('@container w-full min-w-0', className)}>
      {list}
      <StepperSummary label={label} steps={summarySteps} bar className="@md:hidden" />
    </div>
  );
}
