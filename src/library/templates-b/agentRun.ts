/** Where one step of an agent run stands. */
export type AgentRunStepStatus = 'done' | 'running' | 'queued' | 'failed' | 'waiting' | 'skipped';

export type AgentRunCounts = Record<AgentRunStepStatus, number>;

/** How many steps are in each state. */
export function countRunSteps(steps: readonly { status: AgentRunStepStatus }[]): AgentRunCounts {
  const counts: AgentRunCounts = { done: 0, running: 0, queued: 0, failed: 0, waiting: 0, skipped: 0 };
  for (const step of steps) counts[step.status] += 1;
  return counts;
}

/** The state of the run as a whole, derived from its steps. The most urgent state wins. */
export function runStatus(steps: readonly { status: AgentRunStepStatus }[]): 'empty' | 'failed' | 'waiting' | 'running' | 'done' | 'queued' {
  if (steps.length === 0) return 'empty';
  const counts = countRunSteps(steps);
  if (counts.failed > 0) return 'failed';
  if (counts.waiting > 0) return 'waiting';
  if (counts.running > 0) return 'running';
  if (counts.done + counts.skipped === steps.length) return 'done';
  return 'queued';
}

/**
 * One line that says where a run stands without reading the list: "Step 3 of 6 running",
 * "Step 4 needs approval", "Step 2 failed", "All 6 steps done".
 */
export function summarizeRun(steps: readonly { status: AgentRunStepStatus }[]): string {
  const total = steps.length;
  const position = (status: AgentRunStepStatus) => steps.findIndex((step) => step.status === status) + 1;
  const counts = countRunSteps(steps);

  switch (runStatus(steps)) {
    case 'empty':
      return 'No steps yet';
    case 'failed':
      return `Step ${position('failed')} failed`;
    case 'waiting':
      return `Step ${position('waiting')} needs approval`;
    case 'running':
      return `Step ${position('running')} of ${total} running`;
    case 'done':
      if (counts.skipped > 0) return `${counts.done} of ${total} steps done, ${counts.skipped} skipped`;
      return total === 1 ? '1 step done' : `All ${total} steps done`;
    case 'queued':
      return counts.done === 0 ? `${total} ${total === 1 ? 'step' : 'steps'} queued` : `${counts.done} of ${total} steps done`;
  }
}
