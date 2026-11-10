import { render, screen, within } from '@testing-library/react';

import { runStateStatus } from '../status';

import { StageFlow } from './StageFlow';
import type { FlowStage } from './StageFlow';

const STAGES: readonly FlowStage[] = [
  { id: 'inlet', name: 'Inlet', tag: 'NK-20', status: runStateStatus('running'), reading: { label: 'Flow', value: 182400, unit: 'Sm³/h' } },
  {
    id: 'compression',
    name: 'Compression',
    status: runStateStatus('tripped'),
    alarms: { count: 2, severity: 'high' },
    bottleneck: true,
  },
  { id: 'export', name: 'Export', status: runStateStatus('standby') },
];

describe(StageFlow.name, () => {
  it('names the flow and renders one stage per unit', () => {
    const { container } = render(<StageFlow label="Gas train" stages={STAGES} />);
    expect(screen.getByRole('list', { name: 'Gas train' })).toBeInTheDocument();
    expect(container.querySelectorAll('[data-slot="stage"]')).toHaveLength(3);
  });

  it('puts a connector between stages but not after the last', () => {
    const { container } = render(<StageFlow label="Gas train" stages={STAGES} />);
    expect(container.querySelectorAll('[data-slot="stage-connector"]')).toHaveLength(2);
  });

  it('shows state and reading for a stage', () => {
    render(<StageFlow label="Gas train" stages={STAGES} />);
    const inlet = within(screen.getByText('Inlet').closest('li') ?? document.body);
    expect(inlet.getByText('Running')).toBeInTheDocument();
    expect(inlet.getByText('182,400')).toBeInTheDocument();
    expect(inlet.getByText('NK-20')).toBeInTheDocument();
  });

  it('labels the bottleneck in words and counts its alarms', () => {
    render(<StageFlow label="Gas train" stages={STAGES} bottleneckLabel="Limits throughput" />);
    const stage = screen.getByText('Compression').closest('li');
    expect(stage).toHaveAttribute('data-bottleneck', 'true');
    expect(screen.getByText('Limits throughput')).toBeInTheDocument();
    expect(screen.getByText('2 high')).toBeInTheDocument();
  });
});
