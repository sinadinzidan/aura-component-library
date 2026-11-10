import { stepStatus } from './stepStatus';
import type { StepperStep } from './stepStatus';

const STEPS: StepperStep[] = [
  { id: 'source', label: 'Source' },
  { id: 'mapping', label: 'Mapping' },
  { id: 'schedule', label: 'Schedule' },
];

describe(stepStatus.name, () => {
  it('counts steps before the current one as done and later ones as upcoming', () => {
    expect(stepStatus(STEPS[0], 0, 1)).toBe('done');
    expect(stepStatus(STEPS[1], 1, 1)).toBe('current');
    expect(stepStatus(STEPS[2], 2, 1)).toBe('upcoming');
  });

  it('lets an error win over the position', () => {
    expect(stepStatus({ id: 'a', label: 'A', state: 'error' }, 0, 2)).toBe('error');
  });

  it('reports a disabled step that is not current', () => {
    expect(stepStatus({ id: 'a', label: 'A', state: 'disabled' }, 3, 1)).toBe('disabled');
  });
});
