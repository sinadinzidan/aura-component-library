import { summarizeToolCalls } from './summarizeToolCalls';
import type { ToolCallData } from './ToolCall';

const DONE: readonly ToolCallData[] = [
  { id: 'a', toolName: 'find_asset', title: 'Find asset', status: 'completed' },
  { id: 'b', toolName: 'list_alarms', title: 'List alarms', status: 'completed' },
];

describe(summarizeToolCalls.name, () => {
  it('counts finished tools', () => {
    expect(summarizeToolCalls(DONE)).toBe('Used 2 tools');
    expect(summarizeToolCalls(DONE.slice(0, 1))).toBe('Used 1 tool');
  });

  it('points at the running step', () => {
    expect(summarizeToolCalls([DONE[0], { id: 'r', toolName: 'x', status: 'running' }])).toBe('Running step 2 of 2');
  });

  it('counts failures', () => {
    expect(summarizeToolCalls([DONE[0], { id: 'e', toolName: 'x', status: 'error' }])).toBe('1 of 2 steps failed');
  });

  it('puts approval ahead of everything else', () => {
    expect(
      summarizeToolCalls([
        { id: 'r', toolName: 'x', status: 'running' },
        { id: 'p', toolName: 'y', status: 'awaiting-approval' },
      ])
    ).toBe('Step 2 of 2 needs approval');
  });
});
