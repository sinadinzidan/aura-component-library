export type StepperStep = {
  id: string;
  label: string;
  /** One line under the label. Shown in the vertical orientation only. */
  description?: string;
  /** `error`: the step needs attention. `disabled`: the step cannot be reached yet. */
  state?: 'error' | 'disabled';
  /** Marks a step the user may skip. */
  optional?: boolean;
};

export type StepStatus = 'done' | 'current' | 'upcoming' | 'error' | 'disabled';

/** Works out how one step should be shown from its position and its own state. */
export function stepStatus(step: StepperStep, index: number, current: number): StepStatus {
  if (step.state === 'error') return 'error';
  if (index === current) return 'current';
  if (step.state === 'disabled') return 'disabled';
  return index < current ? 'done' : 'upcoming';
}
