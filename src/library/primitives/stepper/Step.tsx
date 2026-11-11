import { IconAlertTriangle, IconCheck, IconMinus, IconX } from '@cognite/aura/icons';
import { useContext } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { StepPositionContext, StepperContext } from './stepperContext';
import type { StepperMarkers, StepperSize } from './stepperContext';
import { STEP_STATE_LABEL, canNavigateToStep, isStepPassed, resolveStepState } from './stepState';
import type { StepState } from './stepState';

export type StepProps = {
  /** Short name of the step: "Select data". */
  label: string;
  /** A quiet second line: what happens here, who did it, or when. */
  description?: ReactNode;
  /** Overrides the state derived from the stepper's `current` index. */
  state?: StepState;
  /** Marks a step people may leave out. */
  optional?: boolean;
  /** Shown in the marker when the stepper uses `markers="icon"`. */
  icon?: ReactNode;
  /** Trailing content in a vertical stepper: a time, a duration or a button. */
  meta?: ReactNode;
  /** Content under the description in a vertical stepper, such as the form of the current step. */
  children?: ReactNode;
};

const MARKER_SIZE: Record<StepperSize, { box: string; text: string; icon: string }> = {
  sm: { box: 'size-5', text: 'text-xs', icon: '[&>svg]:size-3' },
  md: { box: 'size-6', text: 'text-xs', icon: '[&>svg]:size-3.5' },
  lg: { box: 'size-7', text: 'text-sm', icon: '[&>svg]:size-4' },
};

const MARKER_TONE: Record<StepState, string> = {
  complete: 'bg-medium-background text-base-foreground',
  current: 'bg-primary-background text-primary-foreground',
  upcoming: 'border border-emphasized text-muted-foreground',
  error: 'bg-critical-background text-critical-foreground',
  warning: 'bg-warning-background text-warning-foreground',
  skipped: 'border border-dashed border-emphasized text-muted-foreground',
  disabled: 'border border-disabled text-base-foreground-disabled',
};

const DOT_TONE: Record<StepState, string> = {
  complete: 'size-2.5 rounded-full bg-neutral-foreground-strong',
  current: 'size-3.5 rounded-full border-2 border-primary-background',
  upcoming: 'size-2.5 rounded-full border-2 border-emphasized',
  error: 'size-2.5 rotate-45 rounded-none bg-critical-foreground-strong',
  warning: 'size-2.5 rounded-none bg-warning-foreground-strong',
  skipped: 'size-2.5 rounded-full border border-dashed border-emphasized',
  disabled: 'size-2.5 rounded-full border-2 border-disabled',
};

const LABEL_TONE: Record<StepState, string> = {
  complete: 'text-base-foreground',
  current: 'font-medium text-base-foreground',
  upcoming: 'text-muted-foreground',
  error: 'font-medium text-critical-foreground-strong',
  warning: 'font-medium text-base-foreground',
  skipped: 'text-muted-foreground',
  disabled: 'text-base-foreground-disabled',
};

const LINE_HEIGHT: Record<StepperSize, string> = { sm: 'leading-5', md: 'leading-6', lg: 'leading-7' };
/** Connector offsets that follow the marker size: past the marker, and through its centre. */
const VERTICAL_LINE: Record<StepperSize, string> = { sm: 'top-6 left-2.5', md: 'top-7 left-3', lg: 'top-8 left-3.5' };
const HORIZONTAL_LINE: Record<StepperSize, string> = { sm: 'top-2.5 left-7', md: 'top-3 left-8', lg: 'top-3.5 left-9' };

function StepMarker({ state, number, markers, size, icon }: { state: StepState; number: number; markers: StepperMarkers; size: StepperSize; icon: ReactNode }) {
  const sizes = MARKER_SIZE[size];
  if (markers === 'dot') {
    return (
      <span aria-hidden="true" data-slot="step-marker" data-state={state} className={cn('flex shrink-0 items-center justify-center', sizes.box)}>
        <span className={cn('flex items-center justify-center', DOT_TONE[state])}>
          {state === 'current' ? <span className="size-1.5 rounded-full bg-primary-background" /> : null}
        </span>
      </span>
    );
  }
  const glyph =
    state === 'error' ? (
      <IconX />
    ) : state === 'warning' ? (
      <IconAlertTriangle />
    ) : state === 'skipped' ? (
      <IconMinus />
    ) : markers === 'icon' && icon ? (
      icon
    ) : state === 'complete' ? (
      <IconCheck />
    ) : (
      number
    );
  return (
    <span
      aria-hidden="true"
      data-slot="step-marker"
      data-state={state}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-medium tabular-nums',
        sizes.box,
        sizes.text,
        sizes.icon,
        MARKER_TONE[state]
      )}
    >
      {glyph}
    </span>
  );
}

/**
 * One step of a `Stepper`. Its state comes from the stepper's `current` index unless `state` says
 * otherwise, and is carried by the marker's shape and a spoken label as well as by colour.
 */
export function Step({ label, description, state: explicitState, optional = false, icon, meta, children }: StepProps) {
  const { orientation, size, markers, connector, labelPlacement, current, navigation, onStepSelect } = useContext(StepperContext);
  const { index, count } = useContext(StepPositionContext);
  const state = resolveStepState(index, current, explicitState);
  const vertical = orientation === 'vertical';
  const below = !vertical && labelPlacement === 'below';
  const last = index === count - 1;
  const navigable = onStepSelect !== undefined && canNavigateToStep(state, navigation);
  const isCurrent = state === 'current';
  const lineTone = cn(isStepPassed(state) ? 'border-emphasized' : 'border-default', connector === 'dashed' && !isStepPassed(state) && 'border-dashed');

  const text = (
    <span className={cn('flex min-w-0 flex-col text-left', (vertical || below) && 'flex-1')}>
      <span data-slot="step-label" className={cn('text-sm', LINE_HEIGHT[size], !vertical && !below && 'truncate', LABEL_TONE[state])}>
        <span className="sr-only">{STEP_STATE_LABEL[state]}: </span>
        {label}
        {optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
      </span>
      {description ? (
        <span data-slot="step-description" className={cn('text-xs leading-4 text-muted-foreground', state === 'disabled' && 'text-base-foreground-disabled')}>
          {description}
        </span>
      ) : null}
    </span>
  );

  const bodyClass = cn('flex min-w-0 rounded-md', below ? 'flex-col gap-2' : cn('gap-2', vertical ? 'items-start gap-3' : description ? 'items-start' : 'items-center'));
  const marker = <StepMarker state={state} number={index + 1} markers={markers} size={size} icon={icon} />;

  const body = navigable ? (
    <button
      type="button"
      data-slot="step-button"
      aria-current={isCurrent ? 'step' : undefined}
      onClick={() => onStepSelect(index)}
      className={cn(bodyClass, 'cursor-pointer outline-none focus-visible:shadow-focus-ring [&_[data-slot=step-label]]:hover:underline')}
    >
      {marker}
      {text}
    </button>
  ) : (
    <span className={bodyClass}>
      {marker}
      {text}
    </span>
  );

  if (vertical) {
    return (
      <li
        data-slot="step"
        data-state={state}
        aria-current={isCurrent && !navigable ? 'step' : undefined}
        className={cn('relative flex min-w-0 flex-col', !last && (size === 'sm' ? 'pb-4' : 'pb-5'))}
      >
        {last || connector === 'none' ? null : (
          <span aria-hidden="true" data-slot="step-connector" className={cn('absolute bottom-1 border-l', VERTICAL_LINE[size], lineTone)} />
        )}
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex min-w-0 flex-1">{body}</div>
          {meta ? <div className={cn('flex shrink-0 items-center gap-2 text-xs text-muted-foreground tabular-nums', LINE_HEIGHT[size])}>{meta}</div> : null}
        </div>
        {children ? <div className={cn('min-w-0 pt-3', size === 'sm' ? 'pl-8' : size === 'md' ? 'pl-9' : 'pl-10')}>{children}</div> : null}
      </li>
    );
  }

  if (below) {
    return (
      <li
        data-slot="step"
        data-state={state}
        aria-current={isCurrent && !navigable ? 'step' : undefined}
        className={cn('relative flex min-w-0 flex-col pr-3', last ? 'flex-none pr-0' : 'flex-1')}
      >
        {last || connector === 'none' ? null : (
          <span aria-hidden="true" data-slot="step-connector" className={cn('absolute right-2 border-t', HORIZONTAL_LINE[size], lineTone)} />
        )}
        {body}
      </li>
    );
  }

  return (
    <li
      data-slot="step"
      data-state={state}
      aria-current={isCurrent && !navigable ? 'step' : undefined}
      className={cn('flex min-w-0 items-center gap-3', !last && 'flex-auto')}
    >
      {body}
      {last || connector === 'none' ? null : <span aria-hidden="true" data-slot="step-connector" className={cn('min-w-4 flex-1 border-t', lineTone)} />}
    </li>
  );
}
