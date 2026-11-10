import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ToolCall } from './ToolCall';
import type { ToolCallData } from './ToolCall';

const BASE: ToolCallData = {
  id: 'call-1',
  toolName: 'query_time_series',
  title: 'Query time series',
  status: 'completed',
  input: { externalId: '23-PT-92531' },
  output: { points: 288 },
};

describe(ToolCall.name, () => {
  it('names the tool and its status', () => {
    render(<ToolCall call={BASE} />);

    expect(screen.getByRole('button', { name: /Query time series/ })).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('falls back to the tool name when there is no title', () => {
    render(<ToolCall call={{ ...BASE, title: undefined }} />);

    expect(screen.getByRole('button', { name: /query_time_series/ })).toBeInTheDocument();
  });

  it('shows the error badge and text for a failed call', () => {
    render(<ToolCall call={{ ...BASE, status: 'error', output: undefined, errorText: 'Request timed out' }} defaultOpen />);

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Request timed out')).toBeInTheDocument();
  });

  it('shows a running line while the call is in flight', () => {
    render(<ToolCall call={{ ...BASE, status: 'running', output: undefined }} />);

    expect(screen.getByText('Running…')).toBeInTheDocument();
  });

  it('asks for approval and reports the decision', async () => {
    const onApprove = vi.fn();
    const onDeny = vi.fn();
    render(
      <ToolCall
        call={{ ...BASE, status: 'awaiting-approval', output: undefined, approvalReason: 'Creates a work order.' }}
        onApprove={onApprove}
        onDeny={onDeny}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(screen.getByText('Creates a work order.')).toBeInTheDocument();
    expect(onApprove).toHaveBeenCalledWith('call-1');
    expect(onDeny).not.toHaveBeenCalled();
  });

  it('reports a denial', async () => {
    const onDeny = vi.fn();
    render(<ToolCall call={{ ...BASE, status: 'awaiting-approval', output: undefined }} onDeny={onDeny} />);

    await userEvent.click(screen.getByRole('button', { name: 'Deny' }));

    expect(onDeny).toHaveBeenCalledWith('call-1');
  });

  it('has no approval buttons once the call is settled', () => {
    render(<ToolCall call={BASE} />);

    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });
});
