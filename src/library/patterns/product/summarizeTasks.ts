export type AgentTaskStatus = 'done' | 'running' | 'queued' | 'failed' | 'waiting';

export type AgentTask = {
  id: string;
  /** What the step does, verb first: "Read vibration trend". */
  label: string;
  status: AgentTaskStatus;
  /** Result, current activity or reason, in a few words. */
  detail?: string;
};

/** One-line summary of a task list, e.g. "2 of 5 steps done" or "Step 3 needs approval". */
export function summarizeTasks(tasks: readonly AgentTask[]): string {
  const total = tasks.length;
  if (total === 0) return 'No steps planned';
  const waiting = tasks.findIndex((task) => task.status === 'waiting');
  if (waiting !== -1) return `Step ${waiting + 1} of ${total} needs approval`;
  const failed = tasks.findIndex((task) => task.status === 'failed');
  if (failed !== -1) return `Stopped at step ${failed + 1} of ${total}`;
  const done = tasks.filter((task) => task.status === 'done').length;
  if (done === total) return `All ${total} steps done`;
  return `${done} of ${total} steps done`;
}
