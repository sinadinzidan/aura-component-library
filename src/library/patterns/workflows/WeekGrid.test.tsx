import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { WeekGrid } from './WeekGrid';
import type { WeekGridEvent } from './WeekGrid';

const DAYS = [
  { id: 'wed', label: 'Wed 11' },
  { id: 'thu', label: 'Thu 12', today: true },
];

const EVENTS: readonly WeekGridEvent[] = [
  { id: 'a', dayId: 'thu', start: 540, end: 660, title: 'Bearing inspection', detail: 'Crew A' },
  { id: 'b', dayId: 'thu', start: 600, end: 720, title: 'Vibration survey', conflict: true },
  { id: 'c', dayId: 'wed', start: 480, end: 720, title: 'Cooling water outage', kind: 'window' },
];

describe(WeekGrid.name, () => {
  it('puts each event in the list of its day', () => {
    render(<WeekGrid label="Week 11" days={DAYS} events={EVENTS} />);

    const thursday = screen.getByRole('list', { name: 'Thu 12' });

    expect(within(thursday).getByRole('img', { name: /Bearing inspection, 09:00–11:00, Crew A/ })).toBeInTheDocument();
    expect(within(thursday).queryByRole('img', { name: /Cooling water outage/ })).not.toBeInTheDocument();
  });

  it('marks today in the heading', () => {
    render(<WeekGrid label="Week 11" days={DAYS} events={[]} />);

    expect(screen.getByText('Thu 12')).toHaveAttribute('aria-current', 'date');
  });

  it('places overlapping events side by side', () => {
    const { container } = render(<WeekGrid label="Week 11" days={DAYS} events={EVENTS} />);

    const blocks = [...container.querySelectorAll<HTMLElement>('[data-slot="week-grid-day"][aria-label="Thu 12"] [data-slot="week-grid-event"]')];

    expect(blocks.map((block) => block.style.width)).toEqual(['50%', '50%']);
    expect(blocks.map((block) => block.style.left)).toEqual(['0%', '50%']);
  });

  it('names a conflict and a reserved window in words', () => {
    render(<WeekGrid label="Week 11" days={DAYS} events={EVENTS} />);

    expect(screen.getByRole('img', { name: /Vibration survey.*conflict/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Cooling water outage.*reserved window/ })).toBeInTheDocument();
    expect(screen.getByText('Conflict')).toBeInTheDocument();
  });

  it('draws the now line only in its day and inside the window', () => {
    const { container, rerender } = render(<WeekGrid label="Week 11" days={DAYS} events={[]} now={{ dayId: 'thu', minute: 840 }} />);
    expect(container.querySelectorAll('[data-slot="week-grid-now"]')).toHaveLength(1);
    expect(screen.getByText('Now, 14:00')).toBeInTheDocument();

    rerender(<WeekGrid label="Week 11" days={DAYS} events={[]} now={{ dayId: 'thu', minute: 1200 }} />);

    expect(container.querySelectorAll('[data-slot="week-grid-now"]')).toHaveLength(0);
  });

  it('selects an event when blocks are buttons', async () => {
    const onSelect = vi.fn();
    render(<WeekGrid label="Week 11" days={DAYS} events={EVENTS} onSelect={onSelect} selectedId="b" />);

    await userEvent.click(screen.getByRole('button', { name: /Bearing inspection/ }));

    expect(onSelect).toHaveBeenCalledWith('a');
    expect(screen.getByRole('button', { name: /Vibration survey/ })).toHaveAttribute('aria-pressed', 'true');
  });
});
