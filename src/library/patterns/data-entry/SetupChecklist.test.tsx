import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SetupChecklist } from './SetupChecklist';
import type { SetupChecklistItem } from './SetupChecklist';

const ITEMS: SetupChecklistItem[] = [
  { id: 'source', label: 'Connect a data source', done: true, actionLabel: 'Connect source' },
  { id: 'map', label: 'Map tags to assets', description: 'Match 128 tags.', done: false, actionLabel: 'Map tags' },
  { id: 'alarms', label: 'Set alarm limits', done: false, actionLabel: 'Set limits' },
];

describe(SetupChecklist.name, () => {
  it('counts the finished tasks', () => {
    render(<SetupChecklist title="Commission compressor" items={ITEMS} onAction={vi.fn()} />);

    expect(screen.getByText('1 of 3 complete')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Commission compressor' })).toHaveAttribute(
      'aria-valuetext',
      '1 of 3 complete'
    );
  });

  it('says in words which tasks are done', () => {
    render(<SetupChecklist title="Commission compressor" items={ITEMS} onAction={vi.fn()} />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Done: Connect a data source');
    expect(items[1]).toHaveTextContent('To do: Map tags to assets');
  });

  it('offers an action on the next open task only', () => {
    render(<SetupChecklist title="Commission compressor" items={ITEMS} onAction={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Map tags' })).toBeInTheDocument();
  });

  it('reports the task whose action was pressed', async () => {
    const onAction = vi.fn();
    render(<SetupChecklist title="Commission compressor" items={ITEMS} onAction={onAction} />);

    await userEvent.click(screen.getByRole('button', { name: 'Map tags' }));

    expect(onAction).toHaveBeenCalledWith('map');
  });

  it('replaces the count once every task is done', () => {
    const allDone = ITEMS.map((item) => ({ ...item, done: true }));
    render(<SetupChecklist title="Commission compressor" items={allDone} onAction={vi.fn()} completeText="Ready to start" />);

    expect(screen.getByText('Ready to start')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
