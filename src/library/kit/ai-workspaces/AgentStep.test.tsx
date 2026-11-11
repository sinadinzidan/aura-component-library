import { render, screen } from '@testing-library/react';

import { LookScope } from '../../looks/LookScope';

import { AgentStep } from './AgentStep';

describe(AgentStep.name, () => {
  it('says the state in a word next to the step', () => {
    render(
      <ul>
        <AgentStep title="Read vibration trends" state="running" detail="6 time series" duration="0:12" />
      </ul>,
    );

    const step = screen.getByRole('listitem');
    expect(step).toHaveAttribute('data-state', 'running');
    expect(step).toHaveAttribute('data-tone', 'info');
    expect(step).toHaveTextContent('Running');
    expect(step).toHaveTextContent('6 time series');
    expect(step).toHaveTextContent('0:12');
  });

  it('says it needs the person when it is waiting', () => {
    render(
      <ul>
        <AgentStep title="Create work order" state="waiting">
          <button type="button">Approve</button>
        </AgentStep>
      </ul>,
    );

    expect(screen.getByText('Needs you')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
  });

  it('fills the tile with the state in the signal look', () => {
    render(
      <LookScope look="signal">
        <ul>
          <AgentStep title="Post to shift log" state="failed" />
        </ul>
      </LookScope>,
    );

    expect(screen.getByRole('listitem')).toHaveAttribute('data-tone', 'critical');
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
