export type StepState = 'complete' | 'current' | 'upcoming' | 'error' | 'warning' | 'skipped' | 'disabled';

/** Which steps a navigable stepper lets people jump to. */
export type StepNavigation = 'visited' | 'all';

/** The state in words, read out before each step's label. */
export const STEP_STATE_LABEL: Record<StepState, string> = {
  complete: 'Completed',
  current: 'Current',
  upcoming: 'Not started',
  error: 'Needs attention',
  warning: 'Warning',
  skipped: 'Skipped',
  disabled: 'Not available',
};

/**
 * The state of the step at `index`. An explicit state always wins; otherwise steps before
 * `current` are complete, the one at `current` is current and the rest are upcoming. Without a
 * `current` index every step that has no explicit state is upcoming.
 */
export function resolveStepState(index: number, current: number | undefined, explicit?: StepState): StepState {
  if (explicit !== undefined) return explicit;
  if (current === undefined) return 'upcoming';
  if (index < current) return 'complete';
  return index === current ? 'current' : 'upcoming';
}

/** Whether the part of the flow after a step in this state has been passed, so its connector is drawn as done. */
export function isStepPassed(state: StepState): boolean {
  return state === 'complete' || state === 'skipped';
}

/** Whether a navigable stepper lets people jump to a step in this state. */
export function canNavigateToStep(state: StepState, navigation: StepNavigation): boolean {
  if (state === 'disabled') return false;
  return navigation === 'all' || state !== 'upcoming';
}

export type StepProgress = {
  total: number;
  /** Steps that are complete or skipped. */
  passed: number;
  /** Index of the step people are on: the current one, else the first that needs attention, else the first not passed. -1 when all are passed. */
  currentIndex: number;
  /** 0–100, by passed steps. */
  percent: number;
};

/** Summarises a list of step states for the compact and progress variants. */
export function stepProgress(states: readonly StepState[]): StepProgress {
  const total = states.length;
  const passed = states.filter(isStepPassed).length;
  const current = states.indexOf('current');
  const attention = states.findIndex((state) => state === 'error' || state === 'warning');
  const firstOpen = states.findIndex((state) => !isStepPassed(state));
  const currentIndex = current >= 0 ? current : attention >= 0 ? attention : firstOpen;
  return { total, passed, currentIndex, percent: total === 0 ? 0 : Math.round((passed / total) * 100) };
}
