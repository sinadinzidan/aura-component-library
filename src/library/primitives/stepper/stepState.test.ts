import { canNavigateToStep, isStepPassed, resolveStepState, stepProgress } from './stepState';

describe(resolveStepState.name, () => {
  it('marks steps before the current index as complete', () => {
    expect(resolveStepState(0, 2)).toBe('complete');
  });

  it('marks the step at the current index as current', () => {
    expect(resolveStepState(2, 2)).toBe('current');
  });

  it('marks steps after the current index as upcoming', () => {
    expect(resolveStepState(3, 2)).toBe('upcoming');
  });

  it('lets an explicit state win over the position', () => {
    expect(resolveStepState(0, 2, 'error')).toBe('error');
    expect(resolveStepState(3, 2, 'disabled')).toBe('disabled');
  });

  it('treats every step as upcoming without a current index', () => {
    expect(resolveStepState(0, undefined)).toBe('upcoming');
  });

  it('marks every step complete when current is past the end', () => {
    expect(resolveStepState(3, 4)).toBe('complete');
  });
});

describe(isStepPassed.name, () => {
  it.each(['complete', 'skipped'] as const)('counts %s as passed', (state) => {
    expect(isStepPassed(state)).toBe(true);
  });

  it.each(['current', 'upcoming', 'error', 'warning', 'disabled'] as const)('does not count %s as passed', (state) => {
    expect(isStepPassed(state)).toBe(false);
  });
});

describe(canNavigateToStep.name, () => {
  it('never navigates to a disabled step', () => {
    expect(canNavigateToStep('disabled', 'all')).toBe(false);
  });

  it('only reaches visited steps by default', () => {
    expect(canNavigateToStep('complete', 'visited')).toBe(true);
    expect(canNavigateToStep('current', 'visited')).toBe(true);
    expect(canNavigateToStep('error', 'visited')).toBe(true);
    expect(canNavigateToStep('upcoming', 'visited')).toBe(false);
  });

  it('reaches upcoming steps when all are navigable', () => {
    expect(canNavigateToStep('upcoming', 'all')).toBe(true);
  });
});

describe(stepProgress.name, () => {
  it('counts passed steps and finds the current one', () => {
    expect(stepProgress(['complete', 'skipped', 'current', 'upcoming'])).toEqual({ total: 4, passed: 2, currentIndex: 2, percent: 50 });
  });

  it('points at the failed step when none is current', () => {
    expect(stepProgress(['complete', 'error', 'upcoming']).currentIndex).toBe(1);
  });

  it('points at the first open step when nothing is current or failed', () => {
    expect(stepProgress(['complete', 'upcoming', 'upcoming']).currentIndex).toBe(1);
  });

  it('reports -1 and 100% when every step is passed', () => {
    expect(stepProgress(['complete', 'complete'])).toMatchObject({ currentIndex: -1, percent: 100 });
  });

  it('handles no steps', () => {
    expect(stepProgress([])).toEqual({ total: 0, passed: 0, currentIndex: -1, percent: 0 });
  });
});
