import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LookScope } from '../../looks/LookScope';

import { FlowStages, type FlowStageItem } from './FlowStages';

const STAGES: FlowStageItem[] = [
  { id: 'sep', name: 'Separation', tag: '20-VA-1001', state: 'Running', tone: 'success', value: 54.3, decimals: 1, unit: '%', caption: 'Level', load: 61 },
  { id: 'comp', name: 'Compression', tag: '23-KA-9101', state: 'Running', tone: 'warning', value: 48.6, decimals: 1, unit: 'barg', load: 97, alarms: 2 },
];

describe(FlowStages.name, () => {
  it('lists the stages with their reading and state', () => {
    render(<FlowStages label="Gas train" stages={STAGES} links={[{ label: '131.2 t/h' }]} />);

    expect(screen.getByRole('list', { name: 'Gas train' })).toBeInTheDocument();
    expect(screen.getByText('48.6')).toBeInTheDocument();
    expect(screen.getByText('2 alarms')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Flow, 131.2 t/h' })).toBeInTheDocument();
  });

  it('marks the bottleneck', () => {
    const { container } = render(<FlowStages label="Gas train" stages={STAGES} bottleneckId="comp" />);

    expect(container.querySelector('[data-bottleneck]')).toHaveAttribute('data-stage', 'comp');
    expect(screen.getByText('Bottleneck')).toBeInTheDocument();
  });

  it('selects a stage', async () => {
    const onSelect = vi.fn();
    render(<FlowStages label="Gas train" stages={STAGES} selectedId="sep" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /Compression/ }));

    expect(onSelect).toHaveBeenCalledWith('comp');
    expect(screen.getByRole('button', { name: /Separation/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('writes the state as a word instead of a pill in a filled look', () => {
    const { container } = render(
      <LookScope look="signal">
        <FlowStages label="Gas train" stages={STAGES} />
      </LookScope>
    );

    expect(container.querySelector('.kit-pill')).toBeNull();
    expect(screen.getAllByText('Running')).toHaveLength(2);
  });
});
