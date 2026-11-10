import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AgendaList } from './AgendaList';
import type { AgendaDay } from './AgendaList';

const DAYS: readonly AgendaDay[] = [
  {
    id: 'thu',
    label: 'Thursday 12 March',
    note: 'Today',
    events: [
      { id: 'a', start: '08:00', end: '10:00', title: 'Bearing inspection', detail: '23-KA-9103' },
      { id: 'b', start: '09:30', title: 'Permit meeting', conflict: true },
    ],
  },
  { id: 'fri', label: 'Friday 13 March', events: [] },
];

describe(AgendaList.name, () => {
  it('groups events under their day', () => {
    render(<AgendaList days={DAYS} />);

    const thursday = screen.getByRole('region', { name: 'Thursday 12 March' });

    expect(within(thursday).getByText('Bearing inspection')).toBeInTheDocument();
    expect(within(thursday).getByText('08:00–10:00')).toBeInTheDocument();
    expect(within(thursday).getByText('Today')).toBeInTheDocument();
  });

  it('keeps an empty day in the list and says it is free', () => {
    render(<AgendaList days={DAYS} emptyText="No planned work" />);

    const friday = screen.getByRole('region', { name: 'Friday 13 March' });

    expect(within(friday).getByText('No planned work')).toBeInTheDocument();
  });

  it('labels a conflict in words', () => {
    render(<AgendaList days={DAYS} />);

    expect(screen.getByText('Conflict')).toBeInTheDocument();
  });

  it('shows a start time alone when there is no end', () => {
    render(<AgendaList days={DAYS} />);

    expect(screen.getByText('09:30')).toBeInTheDocument();
  });

  it('opens an event from its title', async () => {
    const onSelect = vi.fn();
    render(<AgendaList days={DAYS} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Permit meeting' }));

    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
