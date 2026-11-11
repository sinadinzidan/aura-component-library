import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CalendarGrid } from './CalendarGrid';

const DAYS = [{ day: 1, value: 4.52 }, { day: 2, value: 4.21 }, { day: 3 }];
const toneOf = (value: number) => (value >= 4.5 ? ('success' as const) : ('critical' as const));

describe(CalendarGrid.name, () => {
  it('shows each day with its figure and tone, and a dash for a day without data', () => {
    const { container } = render(<CalendarGrid label="Gas export per day" days={DAYS} firstWeekday={6} toneOf={toneOf} decimals={2} />);

    expect(screen.getByRole('group', { name: 'Gas export per day' })).toBeInTheDocument();
    expect(screen.getByText('4.52')).toBeInTheDocument();
    expect(container.querySelector('[data-day="1"]')).toHaveAttribute('data-tone', 'success');
    expect(container.querySelector('[data-day="2"]')).toHaveAttribute('data-tone', 'critical');
    expect(container.querySelector('[data-day="3"]')).toHaveTextContent('–');
  });

  it('lets a day be selected', async () => {
    const onSelect = vi.fn();
    render(<CalendarGrid label="Gas export per day" days={DAYS} firstWeekday={0} toneOf={toneOf} decimals={2} selected={1} onSelect={onSelect} />);

    expect(screen.getByRole('button', { name: 'Day 1, 4.52' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Day 2, 4.21' }));

    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
