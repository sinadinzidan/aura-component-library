import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AgentRunList } from './AgentRunList';
import type { AgentRunStep } from './AgentRunList';

const STEPS: readonly AgentRunStep[] = [
  { id: 'history', label: 'Read alarm history', status: 'done', detail: '3 trips found', duration: '4 s', trace: <p>list_alarms</p> },
  { id: 'trend', label: 'Compare vibration trends', status: 'running' },
  { id: 'order', label: 'Draft work order', status: 'queued' },
];

describe(AgentRunList.name, () => {
  it('lists the steps in order with a written state, result and duration', () => {
    render(<AgentRunList label="Investigate recompressor trip" steps={STEPS} />);

    const items = within(screen.getByRole('list', { name: 'Investigate recompressor trip' })).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Read alarm history');
    expect(items[0]).toHaveTextContent('3 trips found');
    expect(items[0]).toHaveTextContent('4 s');
    expect(items[0]).toHaveTextContent('Done');
    expect(items[2]).toHaveTextContent('Queued');
  });

  it('marks the running step as the current one', () => {
    render(<AgentRunList label="Run" steps={STEPS} />);

    const items = screen.getAllByRole('listitem');
    expect(items[1]).toHaveAttribute('aria-current', 'step');
    expect(items[0]).not.toHaveAttribute('aria-current');
  });

  it('announces where the run stands and shows actions', () => {
    render(<AgentRunList label="Run" steps={STEPS} actions={<button type="button">Stop run</button>} />);

    expect(screen.getByRole('status')).toHaveTextContent('Step 2 of 3 running');
    expect(screen.getByRole('button', { name: 'Stop run' })).toBeInTheDocument();
  });

  it('keeps a trace closed until its step is opened, and closes it again', async () => {
    const user = userEvent.setup();
    render(<AgentRunList label="Run" steps={STEPS} />);
    const toggle = screen.getByRole('button', { name: /Read alarm history/ });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('list_alarms')).toBeNull();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('list_alarms')).toBeInTheDocument();

    await user.click(toggle);
    expect(screen.queryByText('list_alarms')).toBeNull();
  });

  it('makes only steps with a trace expandable', () => {
    render(<AgentRunList label="Run" steps={STEPS} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('starts with the requested traces open', () => {
    render(<AgentRunList label="Run" steps={STEPS} defaultOpenIds={['history']} />);

    expect(screen.getByText('list_alarms')).toBeInTheDocument();
  });

  it('opens steps that failed or need approval without being asked', () => {
    render(
      <AgentRunList
        label="Run"
        steps={[
          { id: 'a', label: 'Create work order', status: 'waiting', trace: <p>Writes to SAP PM</p> },
          { id: 'b', label: 'Read P&ID', status: 'failed', trace: <p>File not found</p> },
        ]}
      />
    );

    expect(screen.getByText('Writes to SAP PM')).toBeInTheDocument();
    expect(screen.getByText('File not found')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Step 2 failed');
  });

  it('keeps the summary for screen readers when the header is hidden', () => {
    render(<AgentRunList label="Run" steps={STEPS} hideHeader />);

    expect(screen.getByRole('status')).toHaveClass('sr-only');
    expect(screen.queryByText('Run')).toBeNull();
  });
});
