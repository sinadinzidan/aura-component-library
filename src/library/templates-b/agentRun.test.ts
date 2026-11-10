import { countRunSteps, runStatus, summarizeRun } from './agentRun';
import type { AgentRunStepStatus } from './agentRun';

const steps = (...statuses: AgentRunStepStatus[]) => statuses.map((status) => ({ status }));

describe(countRunSteps.name, () => {
  it('counts the steps in each state', () => {
    expect(countRunSteps(steps('done', 'done', 'running', 'queued', 'skipped'))).toEqual({
      done: 2,
      running: 1,
      queued: 1,
      failed: 0,
      waiting: 0,
      skipped: 1,
    });
  });

  it('returns zeros for an empty run', () => {
    expect(countRunSteps([])).toEqual({ done: 0, running: 0, queued: 0, failed: 0, waiting: 0, skipped: 0 });
  });
});

describe(runStatus.name, () => {
  it('is empty without steps', () => {
    expect(runStatus([])).toBe('empty');
  });

  it('lets a failed step win over everything else', () => {
    expect(runStatus(steps('done', 'failed', 'waiting', 'running'))).toBe('failed');
  });

  it('puts waiting for approval before running', () => {
    expect(runStatus(steps('done', 'waiting', 'running'))).toBe('waiting');
  });

  it('is running while a step runs', () => {
    expect(runStatus(steps('done', 'running', 'queued'))).toBe('running');
  });

  it('is done when every step is done or skipped', () => {
    expect(runStatus(steps('done', 'skipped', 'done'))).toBe('done');
  });

  it('is queued when nothing runs and steps remain', () => {
    expect(runStatus(steps('done', 'queued'))).toBe('queued');
  });
});

describe(summarizeRun.name, () => {
  it('says there are no steps', () => {
    expect(summarizeRun([])).toBe('No steps yet');
  });

  it('names the failed step by position', () => {
    expect(summarizeRun(steps('done', 'failed', 'queued'))).toBe('Step 2 failed');
  });

  it('names the step that needs approval', () => {
    expect(summarizeRun(steps('done', 'done', 'done', 'waiting', 'queued'))).toBe('Step 4 needs approval');
  });

  it('names the running step and the total', () => {
    expect(summarizeRun(steps('done', 'done', 'running', 'queued', 'queued', 'queued'))).toBe('Step 3 of 6 running');
  });

  it('says when all steps are done', () => {
    expect(summarizeRun(steps('done', 'done', 'done'))).toBe('All 3 steps done');
  });

  it('uses the singular for a one-step run', () => {
    expect(summarizeRun(steps('done'))).toBe('1 step done');
    expect(summarizeRun(steps('queued'))).toBe('1 step queued');
  });

  it('mentions skipped steps in a finished run', () => {
    expect(summarizeRun(steps('done', 'skipped', 'done'))).toBe('2 of 3 steps done, 1 skipped');
  });

  it('counts progress when the run is paused between steps', () => {
    expect(summarizeRun(steps('done', 'queued', 'queued'))).toBe('1 of 3 steps done');
  });

  it('says how many steps are queued before the run starts', () => {
    expect(summarizeRun(steps('queued', 'queued'))).toBe('2 steps queued');
  });
});
