import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LockBoard, type LockBoardPerson } from './LockBoard';

const PEOPLE: LockBoardPerson[] = [
  { id: 'tb', name: 'Tomás Barros', role: 'Mechanical technician', lock: 'P-21', tone: 'blue', on: true },
  { id: 'jn', name: 'Jonas Nyberg', role: 'Instrument technician', lock: 'P-34', tone: 'purple', on: false },
];

describe(LockBoard.name, () => {
  it('lists each worker with their lock on or off', () => {
    render(<LockBoard label="Lock box LB-07" people={PEOPLE} />);

    const items = within(screen.getByRole('list', { name: 'Lock box LB-07' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Lock P-21 on')).toBeInTheDocument();
    expect(within(items[1]).getByText('Lock off')).toBeInTheDocument();
    expect(items[0]).toHaveAttribute('data-on', 'true');
  });

  it('counts the locks that hold the box', () => {
    render(<LockBoard label="Lock box" people={PEOPLE} />);

    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 personal locks on the box');
    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'warning');
  });

  it('is read-only without a handler', () => {
    render(<LockBoard label="Lock box" people={PEOPLE} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('reports a toggle', async () => {
    const onToggle = vi.fn();
    render(<LockBoard label="Lock box" people={PEOPLE} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: /Jonas Nyberg/ }));
    expect(onToggle).toHaveBeenCalledWith('jn', true);
    expect(screen.getByRole('button', { name: /Tomás Barros/ })).toHaveAttribute('aria-pressed', 'true');
  });
});
