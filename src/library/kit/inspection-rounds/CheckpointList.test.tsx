import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CheckpointList } from './CheckpointList';
import type { Checkpoint } from './rounds';

const CHECKPOINTS: Checkpoint[] = [
  { id: 'a', tag: '23-PT-92531', name: 'Discharge pressure', location: 'Compressor hall', unit: 'barg', low: 40, high: 52, value: 48.6, result: 'pass' },
  { id: 'b', tag: '23-VT-92540', name: 'Drive-end vibration', location: 'Compressor hall', unit: 'mm/s', high: 7.1, value: 7.6, result: 'fail', note: '0.5 above the high limit' },
  { id: 'c', tag: '23-HA-9114', name: 'Cooler flanges', location: 'Cooler deck', result: 'pending' },
];

describe(CheckpointList.name, () => {
  it('lists the stops in route order with reading, limits and result', () => {
    render(<CheckpointList label="Route" checkpoints={CHECKPOINTS} />);

    const items = within(screen.getByRole('list', { name: 'Route' })).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(within(items[0]).getByText('48.6 barg')).toBeInTheDocument();
    expect(within(items[0]).getByText('Limits 40.0–52.0')).toBeInTheDocument();
    expect(within(items[0]).getByText('Pass')).toBeInTheDocument();
    expect(within(items[1]).getByText('Limits max 7.1')).toBeInTheDocument();
    expect(within(items[1]).getByText('0.5 above the high limit')).toBeInTheDocument();
    expect(within(items[2]).getByText('Visual check')).toBeInTheDocument();
    expect(within(items[2]).getByText('To do')).toBeInTheDocument();
  });

  it('marks the current stop and reports a selection', async () => {
    const onSelect = vi.fn();
    render(<CheckpointList label="Route" checkpoints={CHECKPOINTS} current="b" onSelect={onSelect} />);

    expect(screen.getByRole('button', { current: 'step' })).toHaveTextContent('Drive-end vibration');
    await userEvent.click(screen.getByRole('button', { name: /Cooler flanges/ }));
    expect(onSelect).toHaveBeenCalledWith('c');
  });

  it('drops location and limits in compact density', () => {
    render(<CheckpointList label="Route" checkpoints={CHECKPOINTS} density="compact" />);

    expect(screen.queryByText('Compressor hall')).toBeNull();
    expect(screen.queryByText('Limits 40.0–52.0')).toBeNull();
  });
});
