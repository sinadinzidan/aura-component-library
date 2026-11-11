import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LockBoard } from './LockBoard';
import type { LockBoardPerson } from './LockBoard';

const PEOPLE: LockBoardPerson[] = [
  { id: 'tb', name: 'Tomás Barros', role: 'Mechanical technician', lock: 'P-114', lockOn: true, at: '07:12' },
  { id: 'ak', name: 'Aisha Khan', role: 'Rotating equipment engineer', lock: 'P-131', lockOn: true, at: '07:15' },
  { id: 'jn', name: 'Jonas Nyberg', role: 'Instrument technician', lock: 'P-122', lockOn: false, at: '11:40' },
];

describe(LockBoard.name, () => {
  it('names the lock box and says how many keys are inside', () => {
    render(<LockBoard boxId="LB-07" keysInside={9} people={PEOPLE} />);

    const board = screen.getByRole('region', { name: 'Lock box LB-07' });
    expect(within(board).getByText('Keys to 9 isolation locks inside')).toBeVisible();
  });

  it('counts the personal locks that are on', () => {
    render(<LockBoard boxId="LB-07" keysInside={9} people={PEOPLE} />);

    expect(screen.getByText('2 of 3 personal locks on')).toBeVisible();
  });

  it('says lock on or lock off for every person, with the lock number', () => {
    render(<LockBoard boxId="LB-07" keysInside={9} people={PEOPLE} />);

    const hasps = screen.getAllByRole('listitem');
    expect(hasps[0]).toHaveTextContent('Lock on');
    expect(hasps[0]).toHaveTextContent('P-114');
    expect(hasps[2]).toHaveTextContent('Lock off');
    expect(hasps[2]).toHaveAttribute('data-on', 'false');
  });

  it('says whose lock still blocks the removal of isolations', () => {
    render(<LockBoard boxId="LB-07" keysInside={9} people={PEOPLE} />);

    expect(screen.getByRole('status')).toHaveTextContent('2 personal locks still on: Tomás Barros, Aisha Khan.');
  });

  it('says the isolations can be removed when every lock is off', () => {
    const { container } = render(<LockBoard boxId="LB-07" keysInside={9} people={PEOPLE.map((person) => ({ ...person, lockOn: false }))} />);

    expect(screen.getByRole('status')).toHaveTextContent('All personal locks are off');
    expect(container.querySelector('[data-slot="lock-board"]')).toHaveAttribute('data-ready', 'true');
  });

  it('has no buttons when it is read-only', () => {
    render(<LockBoard boxId="LB-07" keysInside={9} people={PEOPLE} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('reports the person whose lock is toggled', async () => {
    const onToggle = vi.fn();
    render(<LockBoard boxId="LB-07" keysInside={9} people={PEOPLE} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove lock P-114, Tomás Barros' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hang lock P-122, Jonas Nyberg' }));

    expect(onToggle).toHaveBeenNthCalledWith(1, 'tb');
    expect(onToggle).toHaveBeenNthCalledWith(2, 'jn');
  });
});
