import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { Station } from './lines';
import { LineStrip } from './LineStrip';

const STATIONS: Station[] = [
  { id: 's1', code: 'S1', name: 'Housing load', state: 'running', cycleSeconds: 44, buffer: { count: 4, capacity: 6 } },
  { id: 's2', code: 'S2', name: 'Gear assembly', state: 'running', cycleSeconds: 52, buffer: { count: 6, capacity: 6 } },
  { id: 's3', code: 'S3', name: 'Torque and seal', state: 'down', since: '12 min' },
];

describe(LineStrip.name, () => {
  it('shows each station with its state and cycle time', () => {
    render(<LineStrip label="Line 3" stations={STATIONS} taktSeconds={48} />);

    expect(screen.getByRole('list', { name: 'Line 3' })).toBeInTheDocument();
    expect(screen.getByText('Housing load')).toBeInTheDocument();
    expect(screen.getByText('44 s')).toBeInTheDocument();
    expect(screen.getByText('52 s, over takt')).toBeInTheDocument();
    expect(screen.getByText('Down')).toBeInTheDocument();
    expect(screen.getByText('12 min')).toBeInTheDocument();
  });

  it('names the slowest station the bottleneck', () => {
    const { container } = render(<LineStrip label="Line 3" stations={STATIONS} taktSeconds={48} />);

    expect(screen.getAllByText('Bottleneck')).toHaveLength(1);
    expect(container.querySelector('[data-bottleneck]')).toHaveTextContent('Gear assembly');
  });

  it('describes the buffers between stations', () => {
    render(<LineStrip label="Line 3" stations={STATIONS} taktSeconds={48} />);

    expect(screen.getByRole('img', { name: 'Buffer after Housing load: 4 of 6' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Buffer after Gear assembly: 6 of 6' })).toHaveAttribute('data-tone', 'warning');
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('reports a selection and marks the selected station', async () => {
    const onSelect = vi.fn();
    render(<LineStrip label="Line 3" stations={STATIONS} taktSeconds={48} selected="s3" onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: /Torque and seal/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Housing load/ }));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });
});
