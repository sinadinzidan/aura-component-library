import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { CautionItem } from './cautions';
import { CautionStrip } from './CautionStrip';

const ITEMS: readonly CautionItem[] = [
  { id: 'a', level: 'advisory', message: 'Standby test overdue', source: '27-PA-2001B', raisedAt: 50, time: '09:00' },
  { id: 'b', level: 'caution', message: 'Discharge temperature high', source: '23-TT-92532', raisedAt: 10, time: '13:22' },
  { id: 'c', level: 'warning', message: 'Recompressor tripped', source: '23-KA-9103', raisedAt: 5, time: '13:46' },
];

describe(CautionStrip.name, () => {
  it('lists messages in priority order with the level in words', () => {
    render(<CautionStrip items={ITEMS} />);

    const rows = within(screen.getByRole('list', { name: 'Crew alerting' })).getAllByRole('listitem');
    expect(rows.map((row) => row.getAttribute('data-level'))).toEqual(['warning', 'caution', 'advisory']);
    expect(rows[0]).toHaveTextContent('Warning');
    expect(rows[0]).toHaveTextContent('Recompressor tripped');
  });

  it('summarises the counts per level', () => {
    const { container } = render(<CautionStrip items={ITEMS} />);

    const counts = [...container.querySelectorAll('[data-slot="caution-count"]')].map((node) => node.textContent);
    expect(counts).toEqual(['1 warning', '1 caution', '1 advisory']);
  });

  it('shows the most urgent rows and counts the rest', () => {
    render(<CautionStrip items={ITEMS} limit={2} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('1 more of lower priority')).toBeInTheDocument();
  });

  it('reports the id of the acknowledged message', async () => {
    const onAcknowledge = vi.fn();
    render(<CautionStrip items={ITEMS} onAcknowledge={onAcknowledge} />);

    await userEvent.click(screen.getByRole('button', { name: 'Acknowledge Recompressor tripped' }));

    expect(onAcknowledge).toHaveBeenCalledWith('c');
  });

  it('replaces the action with a label once acknowledged', () => {
    render(<CautionStrip items={[{ ...ITEMS[2], acknowledged: true }]} onAcknowledge={vi.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Acknowledged')).toBeInTheDocument();
  });

  it('says so when nothing is abnormal', () => {
    render(<CautionStrip items={[]} />);

    expect(screen.getByText('No cautions or warnings.')).toBeInTheDocument();
  });
});
