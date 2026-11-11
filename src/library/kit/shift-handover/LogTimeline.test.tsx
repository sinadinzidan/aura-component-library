import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LogTimeline, type LogEntry } from './LogTimeline';

const ENTRIES: LogEntry[] = [
  { id: 'a', time: '13:46', section: 'Compression', headline: 'Recompressor tripped', body: 'High vibration at the drive end.', state: 'Open', tone: 'critical', tags: ['23-KA-9103'], by: 'IH', needsAck: true },
  { id: 'b', time: '09:10', section: 'Inlet', headline: 'Stroke test passed', body: 'Valve closed in 11 seconds.', state: 'Closed', tone: 'success' },
];

describe(LogTimeline.name, () => {
  it('lists entries with time, section, state and tags', () => {
    render(<LogTimeline label="Day shift log" entries={ENTRIES} />);

    const items = within(screen.getByRole('list', { name: 'Day shift log' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('13:46')).toBeInTheDocument();
    expect(within(items[0]).getByText('Open')).toBeInTheDocument();
    expect(within(items[0]).getByText('23-KA-9103')).toBeInTheDocument();
    expect(within(items[0]).getByText('by IH')).toBeInTheDocument();
  });

  it('offers a tick box only on entries that need acknowledging', () => {
    render(<LogTimeline label="Log" entries={ENTRIES} />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByText('Read and understood')).toBeInTheDocument();
  });

  it('reports a tick and marks acknowledged entries', async () => {
    const onAcknowledge = vi.fn();
    const { rerender } = render(<LogTimeline label="Log" entries={ENTRIES} onAcknowledge={onAcknowledge} />);

    await userEvent.click(screen.getByRole('checkbox'));
    expect(onAcknowledge).toHaveBeenCalledWith('a', true);

    rerender(<LogTimeline label="Log" entries={ENTRIES} acknowledged={['a']} onAcknowledge={onAcknowledge} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByText('· acknowledged')).toBeInTheDocument();
  });

  it('drops the body in compact density', () => {
    render(<LogTimeline label="Log" entries={ENTRIES} density="compact" />);

    expect(screen.queryByText('High vibration at the drive end.')).toBeNull();
    expect(screen.getByText('Recompressor tripped')).toBeInTheDocument();
  });
});
