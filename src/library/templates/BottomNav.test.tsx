import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BottomNav } from './BottomNav';
import type { BottomNavItem } from './BottomNav';

const ITEMS: readonly BottomNavItem[] = [
  { id: 'rounds', label: 'Rounds', icon: <svg /> },
  { id: 'alarms', label: 'Alarms', icon: <svg />, count: 4 },
  { id: 'orders', label: 'Work orders', icon: <svg /> },
];

describe(BottomNav.name, () => {
  it('renders a named navigation with one button per destination', () => {
    render(<BottomNav label="Main" items={ITEMS} activeId="rounds" onSelect={vi.fn()} />);

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('marks the current destination', () => {
    render(<BottomNav label="Main" items={ITEMS} activeId="alarms" onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Alarms/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Rounds' })).not.toHaveAttribute('aria-current');
  });

  it('reports the destination that was chosen', async () => {
    const onSelect = vi.fn();
    render(<BottomNav label="Main" items={ITEMS} activeId="rounds" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Work orders' }));

    expect(onSelect).toHaveBeenCalledWith('orders');
  });

  it('includes the count in the name of the destination', () => {
    render(<BottomNav label="Main" items={ITEMS} activeId="rounds" onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /4.*Alarms/ })).toBeInTheDocument();
  });
});
