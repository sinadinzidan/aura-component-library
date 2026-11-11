import { createContext } from 'react';

import type { StepNavigation } from './stepState';

export type StepperOrientation = 'horizontal' | 'vertical';
export type StepperSize = 'sm' | 'md' | 'lg';
export type StepperMarkers = 'number' | 'dot' | 'icon';
export type StepperConnector = 'solid' | 'dashed' | 'none';
export type StepperLabelPlacement = 'inline' | 'below';

export type StepperContextValue = {
  orientation: StepperOrientation;
  size: StepperSize;
  markers: StepperMarkers;
  connector: StepperConnector;
  labelPlacement: StepperLabelPlacement;
  current: number | undefined;
  navigation: StepNavigation;
  onStepSelect: ((index: number) => void) | undefined;
};

export const StepperContext = createContext<StepperContextValue>({
  orientation: 'horizontal',
  size: 'md',
  markers: 'number',
  connector: 'solid',
  labelPlacement: 'inline',
  current: undefined,
  navigation: 'visited',
  onStepSelect: undefined,
});

/** Where a `Step` sits among its siblings. Set by `Stepper`. */
export const StepPositionContext = createContext<{ index: number; count: number }>({ index: 0, count: 1 });
