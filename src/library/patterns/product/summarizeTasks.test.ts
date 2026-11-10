import { summarizeTasks } from './summarizeTasks';
import type { AgentTask } from './summarizeTasks';

const TASKS: readonly AgentTask[] = [
  { id: 'a', label: 'Read alarm history', status: 'done', detail: '3 trips found' },
  { id: 'b', label: 'Compare vibration trends', status: 'running' },
  { id: 'c', label: 'Draft work order', status: 'queued' },
];

describe(summarizeTasks.name, () => {
  it('counts the finished steps', () => {
    expect(summarizeTasks(TASKS)).toBe('1 of 3 steps done');
  });

  it('says when every step is done', () => {
    expect(summarizeTasks(TASKS.map((task) => ({ ...task, status: 'done' })))).toBe('All 3 steps done');
  });

  it('puts a step that waits for approval first', () => {
    expect(summarizeTasks([TASKS[0], { ...TASKS[1], status: 'failed' }, { ...TASKS[2], status: 'waiting' }])).toBe(
      'Step 3 of 3 needs approval'
    );
  });

  it('says where a failed run stopped', () => {
    expect(summarizeTasks([TASKS[0], { ...TASKS[1], status: 'failed' }, TASKS[2]])).toBe('Stopped at step 2 of 3');
  });

  it('handles an empty plan', () => {
    expect(summarizeTasks([])).toBe('No steps planned');
  });
});
