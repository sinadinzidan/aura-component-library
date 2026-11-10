import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ToolCallData } from './ToolCall';
import { ToolCallList } from './ToolCallList';

const DONE: readonly ToolCallData[] = [
  { id: 'a', toolName: 'find_asset', title: 'Find asset', status: 'completed' },
  { id: 'b', toolName: 'list_alarms', title: 'List alarms', status: 'completed' },
];

describe(ToolCallList.name, () => {
  it('renders the calls in order', () => {
    render(<ToolCallList calls={DONE} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Find asset');
    expect(items[1]).toHaveTextContent('List alarms');
  });

  it('folds a finished run behind its summary when collapsible', () => {
    render(<ToolCallList calls={DONE} collapsible />);

    expect(screen.getByRole('button', { name: 'Used 2 tools' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the run on click', async () => {
    render(<ToolCallList calls={DONE} collapsible />);

    await userEvent.click(screen.getByRole('button', { name: 'Used 2 tools' }));

    expect(screen.getByRole('button', { name: 'Used 2 tools' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens by itself while a call is waiting for approval', () => {
    const calls: readonly ToolCallData[] = [...DONE, { id: 'c', toolName: 'create_work_order', status: 'awaiting-approval' }];
    render(<ToolCallList calls={calls} collapsible />);

    expect(screen.getByRole('button', { name: 'Step 3 of 3 needs approval' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('passes approval decisions through', async () => {
    const onApprove = vi.fn();
    const calls: readonly ToolCallData[] = [{ id: 'c', toolName: 'create_work_order', status: 'awaiting-approval' }];
    render(<ToolCallList calls={calls} onApprove={onApprove} />);

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(onApprove).toHaveBeenCalledWith('c');
  });

  it('renders nothing without calls', () => {
    const { container } = render(<ToolCallList calls={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
