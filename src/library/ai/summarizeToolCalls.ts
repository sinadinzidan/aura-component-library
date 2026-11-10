import type { ToolCallData } from './ToolCall';

/** One-line summary of a run of tool calls, e.g. "Running step 2 of 4" or "Used 3 tools". */
export function summarizeToolCalls(calls: readonly ToolCallData[]): string {
  const total = calls.length;
  const approval = calls.findIndex((call) => call.status === 'awaiting-approval');
  if (approval !== -1) return `Step ${approval + 1} of ${total} needs approval`;
  const running = calls.findIndex((call) => call.status === 'running');
  if (running !== -1) return `Running step ${running + 1} of ${total}`;
  const failed = calls.filter((call) => call.status === 'error').length;
  if (failed > 0) return `${failed} of ${total} ${total === 1 ? 'step' : 'steps'} failed`;
  return total === 1 ? 'Used 1 tool' : `Used ${total} tools`;
}
