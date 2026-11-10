import { render, screen, within } from '@testing-library/react';

import type { AgentTask } from './summarizeTasks';
import { TaskProgressList } from './TaskProgressList';

const TASKS: readonly AgentTask[] = [
  { id: 'a', label: 'Read alarm history', status: 'done', detail: '3 trips found' },
  { id: 'b', label: 'Compare vibration trends', status: 'running' },
  { id: 'c', label: 'Draft work order', status: 'queued' },
];

describe(TaskProgressList.name, () => {
  it('lists the steps in order with a written state', () => {
    render(<TaskProgressList label="Investigate recompressor trip" tasks={TASKS} />);

    const items = within(screen.getByRole('list', { name: 'Investigate recompressor trip' })).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Read alarm history3 trips foundDone');
    expect(items[2]).toHaveTextContent('Queued');
  });

  it('marks the running step as the current one', () => {
    render(<TaskProgressList label="Investigate recompressor trip" tasks={TASKS} />);

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('announces the summary and shows actions', () => {
    render(<TaskProgressList label="Investigate recompressor trip" tasks={TASKS} actions={<button type="button">Stop run</button>} />);

    expect(screen.getByRole('status')).toHaveTextContent('1 of 3 steps done');
    expect(screen.getByRole('button', { name: 'Stop run' })).toBeInTheDocument();
  });
});
