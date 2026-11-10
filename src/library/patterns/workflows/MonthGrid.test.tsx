import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { monthCells } from './monthCells';
import { MonthGrid } from './MonthGrid';

const WEEKS = monthCells(2026, 2);
const ENTRIES = {
  '2026-03-12': { count: 5, flagged: true },
  '2026-03-13': { count: 1 },
};

describe(MonthGrid.name, () => {
  it('renders a named table with one column per weekday', () => {
    render(<MonthGrid label="March 2026" weeks={WEEKS} />);

    expect(screen.getByRole('table', { name: 'March 2026' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(7);
  });

  it('names each day with its count, today and attention', () => {
    render(<MonthGrid label="March 2026" weeks={WEEKS} entries={ENTRIES} todayKey="2026-03-12" onSelect={vi.fn()} noun={{ one: 'job', other: 'jobs' }} />);

    expect(screen.getByRole('button', { name: '12, today, 5 jobs, needs attention' })).toHaveAttribute('aria-current', 'date');
    expect(screen.getByRole('button', { name: '13, 1 job' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '14, no jobs' })).toBeInTheDocument();
  });

  it('caps the dots at three and prints the rest', () => {
    const { container } = render(<MonthGrid label="March 2026" weeks={WEEKS} entries={ENTRIES} />);

    expect(container.querySelectorAll('[data-slot="month-grid-dot"]')).toHaveLength(4);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('prints the number in count display', () => {
    const { container } = render(<MonthGrid label="March 2026" weeks={WEEKS} entries={ENTRIES} display="count" />);

    expect(container.querySelectorAll('[data-slot="month-grid-dot"]')).toHaveLength(0);
    expect([...container.querySelectorAll('[data-slot="month-grid-count"]')].map((node) => node.textContent)).toEqual(['5', '1']);
  });

  it('selects a day of the month', async () => {
    const onSelect = vi.fn();
    render(<MonthGrid label="March 2026" weeks={WEEKS} onSelect={onSelect} selectedKey="2026-03-13" />);

    await userEvent.click(screen.getByRole('button', { name: /^20,/ }));

    expect(onSelect).toHaveBeenCalledWith('2026-03-20');
    expect(screen.getByRole('button', { name: /^13,/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not make days of the neighbouring months selectable', () => {
    render(<MonthGrid label="March 2026" weeks={WEEKS} onSelect={vi.fn()} />);

    // 23 February pads the first week and 23 March is in the month: only the latter is a button.
    expect(screen.getAllByRole('button', { name: /^23,/ })).toHaveLength(1);
  });
});
